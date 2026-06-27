import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CubeImportComponent } from './components/cube-import/cube-import.component';
import { NetworkGraphComponent } from './components/network-graph/network-graph.component';
import { RelationshipPanelComponent } from './components/relationship-panel/relationship-panel.component';
import type { CubeCard } from './models/cube.model';
import { NetworkStateService } from './services/network-state.service';

type ConnectPhase =
  | { type: 'browse' }
  | { type: 'source'; sourceId: string; sourceName: string }
  | { type: 'naming'; sourceId: string; targetId: string; sourceName: string; targetName: string };

@Component({
  selector: 'cn-root',
  standalone: true,
  imports: [FormsModule, CubeImportComponent, NetworkGraphComponent, RelationshipPanelComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  protected state = inject(NetworkStateService);

  protected panelOpen = signal(false);
  protected phase = signal<ConnectPhase>({ type: 'browse' });
  protected pendingLabel = signal('');

  protected connectMode = computed(() => this.phase().type !== 'browse');
  protected sourceNodeId = computed(() => {
    const p = this.phase();
    return p.type === 'source' && p.sourceId ? p.sourceId : null;
  });

  protected phaseHint = computed(() => {
    const p = this.phase();
    if (p.type === 'source') {
      return p.sourceId
        ? `Source: ${p.sourceName} — click target card`
        : 'Click a card to start connecting';
    }
    return null;
  });

  protected namingPhase = computed(() => {
    const p = this.phase();
    return p.type === 'naming' ? p : null;
  });

  onCubeImported(event: { cubeId: string; cards: CubeCard[] }): void {
    this.state.loadCube(event.cubeId, event.cards);
    this.phase.set({ type: 'browse' });
  }

  toggleConnectMode(): void {
    if (this.connectMode()) {
      this.phase.set({ type: 'browse' });
    } else {
      this.phase.set({ type: 'source', sourceId: '', sourceName: '' });
    }
  }

  onNodeClicked(event: { nodeId: string; nodeName: string }): void {
    const p = this.phase();
    if (p.type === 'browse') {return;}

    if (p.type === 'source') {
      if (!p.sourceId) {
        this.phase.set({ type: 'source', sourceId: event.nodeId, sourceName: event.nodeName });
      } else if (p.sourceId === event.nodeId) {
        this.phase.set({ type: 'source', sourceId: '', sourceName: '' });
      } else {
        this.pendingLabel.set('');
        this.phase.set({
          type: 'naming',
          sourceId: p.sourceId,
          sourceName: p.sourceName,
          targetId: event.nodeId,
          targetName: event.nodeName,
        });
      }
    }
  }

  confirmRelationship(): void {
    const p = this.phase();
    const label = this.pendingLabel().trim();
    if (p.type !== 'naming' || !label) {return;}
    this.state.addRelationship(p.sourceId, p.targetId, label);
    this.phase.set({ type: 'source', sourceId: '', sourceName: '' });
    this.pendingLabel.set('');
  }

  cancelNaming(): void {
    this.phase.set({ type: 'source', sourceId: '', sourceName: '' });
    this.pendingLabel.set('');
  }
}
