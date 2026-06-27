import {
  Component,
  type ElementRef,
  type OnDestroy,
  type OnInit,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { DataSet, Network } from 'vis-network/standalone';
import type { CubeCard } from '../../models/cube.model';
import { NetworkStateService } from '../../services/network-state.service';

type VisNode = {
  id: string;
  label: string;
  color: {
    background: string;
    border: string;
    highlight: { background: string; border: string };
  };
  font: { color: string };
  title: string;
  shape: string;
};

type VisEdge = {
  id: string;
  from: string;
  to: string;
  label: string;
  arrows: string;
  font: { align: string };
};

const COLOR_MAP: Record<string, { bg: string; border: string; text: string }> = {
  W: { bg: '#F9F6E8', border: '#C8B870', text: '#333' },
  U: { bg: '#2B7EB0', border: '#1A5E85', text: '#fff' },
  B: { bg: '#1A1A1A', border: '#555', text: '#eee' },
  R: { bg: '#B8261F', border: '#8B1A15', text: '#fff' },
  G: { bg: '#1A6C3A', border: '#104727', text: '#fff' },
  multi: { bg: '#C9A227', border: '#9A7A1A', text: '#111' },
  colorless: { bg: '#888', border: '#555', text: '#fff' },
};

function cardColors(card: CubeCard) {
  if (card.colors.length === 0) {return COLOR_MAP['colorless'];}
  if (card.colors.length > 1) {return COLOR_MAP['multi'];}
  return COLOR_MAP[card.colors[0]] ?? COLOR_MAP['colorless'];
}

function toVisNode(card: CubeCard, sourceId: string | null): VisNode {
  const c = cardColors(card);
  const isSource = card.id === sourceId;
  return {
    id: card.id,
    label: card.name,
    shape: 'box',
    color: {
      background: isSource ? '#FFD700' : c.bg,
      border: isSource ? '#FFA500' : c.border,
      highlight: { background: '#FFD700', border: '#FFA500' },
    },
    font: { color: isSource ? '#111' : c.text },
    title: `${card.name}\n${card.type}${card.cmc ? `\nMana value: ${card.cmc}` : ''}`,
  };
}

@Component({
  selector: 'cn-network-graph',
  standalone: true,
  template: `<div #container class="graph-container"></div>`,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .graph-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class NetworkGraphComponent implements OnInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  readonly connectMode = input<boolean>(false);
  readonly sourceNodeId = input<string | null>(null);
  readonly nodeClick = output<{ nodeId: string; nodeName: string }>();

  private state = inject(NetworkStateService);
  private network?: Network;
  private readonly nodes = new DataSet<VisNode>([]);
  private readonly edges = new DataSet<VisEdge>([]);

  constructor() {
    // Sync cards → vis nodes (also reacts to sourceNodeId changes for highlighting)
    effect(() => {
      const cards = this.state.cards();
      const sourceId = this.sourceNodeId();
      this.nodes.clear();
      this.nodes.add(cards.map((c) => toVisNode(c, sourceId)));
    });

    // Sync relationships → vis edges
    effect(() => {
      const rels = this.state.relationships();
      this.edges.clear();
      this.edges.add(
        rels.map(
          (r): VisEdge => ({
            id: r.id,
            from: r.sourceId,
            to: r.targetId,
            label: r.label,
            arrows: 'to',
            font: { align: 'middle' },
          }),
        ),
      );
    });
  }

  ngOnInit(): void {
    this.network = new Network(
      this.containerRef.nativeElement,
      { nodes: this.nodes, edges: this.edges },
      {
        physics: {
          enabled: true,
          solver: 'forceAtlas2Based',
          stabilization: { iterations: 150 },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
          selectConnectedEdges: false,
        },
        edges: {
          font: { size: 11, color: '#555' },
          color: { color: '#999', highlight: '#555' },
          smooth: { enabled: true, type: 'dynamic', roundness: 0.5 },
        },
        nodes: {
          borderWidth: 1.5,
          margin: { top: 5, right: 8, bottom: 5, left: 8 },
        },
      },
    );

    this.network.on('click', (params) => {
      if (!this.connectMode()) {return;}
      const nodeId = params.nodes[0] as string | undefined;
      if (!nodeId) {return;}
      const card = this.state.cards().find((c) => c.id === nodeId);
      if (card) {
        this.nodeClick.emit({ nodeId: card.id, nodeName: card.name });
      }
    });
  }

  ngOnDestroy(): void {
    this.network?.destroy();
  }
}
