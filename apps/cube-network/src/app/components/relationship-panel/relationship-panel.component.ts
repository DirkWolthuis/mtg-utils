import { Component, inject } from '@angular/core';
import { NetworkStateService } from '../../services/network-state.service';

@Component({
  selector: 'cn-relationship-panel',
  standalone: true,
  template: `
    <div class="panel-header">
      <h2>Relationships</h2>
      <span class="count">{{ state.relationships().length }}</span>
    </div>

    @if (state.relationships().length === 0) {
      <p class="empty-hint">
        Enable <strong>Connect mode</strong> in the toolbar, then click two cards to create a
        relationship.
      </p>
    }

    <ul class="rel-list">
      @for (rel of state.relationships(); track rel.id) {
        <li class="rel-item">
          <div class="rel-names">
            <span class="card-name">{{ state.getCardName(rel.sourceId) }}</span>
            <span class="rel-arrow">→</span>
            <span class="card-name">{{ state.getCardName(rel.targetId) }}</span>
          </div>
          <div class="rel-footer">
            <span class="rel-label">{{ rel.label }}</span>
            <button class="delete-btn" (click)="state.deleteRelationship(rel.id)" title="Delete">
              ✕
            </button>
          </div>
        </li>
      }
    </ul>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border-bottom: 1px solid #e0e0e0;
        flex-shrink: 0;
      }

      h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #333;
      }

      .count {
        background: #1a1a2e;
        color: #fff;
        border-radius: 10px;
        padding: 1px 7px;
        font-size: 12px;
        font-weight: 600;
      }

      .empty-hint {
        padding: 16px;
        color: #777;
        font-size: 13px;
        line-height: 1.5;
        margin: 0;
      }

      .rel-list {
        list-style: none;
        margin: 0;
        padding: 8px;
        overflow-y: auto;
        flex: 1;
      }

      .rel-item {
        background: #fafafa;
        border: 1px solid #e8e8e8;
        border-radius: 6px;
        padding: 10px 12px;
        margin-bottom: 8px;
      }

      .rel-names {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 6px;
      }

      .card-name {
        font-size: 12px;
        font-weight: 500;
        color: #222;
        background: #e8e8e8;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .rel-arrow {
        color: #999;
        font-size: 12px;
      }

      .rel-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .rel-label {
        font-size: 12px;
        color: #555;
        font-style: italic;
      }

      .delete-btn {
        background: none;
        border: none;
        color: #bbb;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 11px;
        border-radius: 3px;
        transition: color 0.15s;
      }

      .delete-btn:hover {
        color: #c0392b;
      }
    `,
  ],
})
export class RelationshipPanelComponent {
  protected state = inject(NetworkStateService);
}
