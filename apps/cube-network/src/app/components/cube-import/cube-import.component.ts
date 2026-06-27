import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CubeCard } from '../../models/cube.model';
import { CubeImportService } from '../../services/cube-import.service';

type ImportMode = 'id' | 'list';
type ImportStatus = { type: 'idle' } | { type: 'loading' } | { type: 'error'; message: string };

@Component({
  selector: 'cn-cube-import',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="import-wrapper">
      <div class="mode-tabs">
        <button class="tab" [class.active]="mode() === 'id'" (click)="mode.set('id')" type="button">
          Cube Cobra ID
        </button>
        <button
          class="tab"
          [class.active]="mode() === 'list'"
          (click)="mode.set('list')"
          type="button"
        >
          Paste list
        </button>
      </div>

      @if (mode() === 'id') {
        <div class="input-row">
          <input
            class="text-input"
            [(ngModel)]="cubeId"
            placeholder="e.g. powered-vintage"
            (keydown.enter)="importById()"
          />
          <button
            class="import-btn"
            (click)="importById()"
            [disabled]="status().type === 'loading'"
          >
            @if (status().type === 'loading') {
              Loading…
            } @else {
              Import
            }
          </button>
        </div>
      } @else {
        <div class="input-row list-mode">
          <textarea
            class="text-area"
            [(ngModel)]="cardList"
            placeholder="Paste card names, one per line"
            rows="4"
          ></textarea>
          <button
            class="import-btn"
            (click)="importFromList()"
            [disabled]="status().type === 'loading'"
          >
            @if (status().type === 'loading') {
              Loading…
            } @else {
              Import
            }
          </button>
        </div>
      }

      @if (status().type === 'error') {
        <p class="error-msg">{{ $any(status()).message }}</p>
      }
    </div>
  `,
  styles: [
    `
      .import-wrapper {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .mode-tabs {
        display: flex;
        gap: 4px;
      }

      .tab {
        background: none;
        border: 1px solid #555;
        color: #ccc;
        padding: 3px 10px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: background 0.15s;
      }

      .tab.active {
        background: #fff;
        color: #1a1a2e;
        border-color: #fff;
        font-weight: 600;
      }

      .input-row {
        display: flex;
        gap: 6px;
        align-items: flex-start;
      }

      .text-input {
        flex: 1;
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #555;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 13px;
        min-width: 180px;
      }

      .text-input::placeholder,
      .text-area::placeholder {
        color: #aaa;
      }

      .text-area {
        flex: 1;
        padding: 6px 10px;
        border-radius: 4px;
        border: 1px solid #555;
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 13px;
        resize: vertical;
        min-width: 200px;
      }

      .import-btn {
        padding: 6px 16px;
        background: #c9a227;
        border: none;
        border-radius: 4px;
        color: #111;
        font-weight: 700;
        cursor: pointer;
        font-size: 13px;
        transition: opacity 0.15s;
        white-space: nowrap;
      }

      .import-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .error-msg {
        color: #f87171;
        font-size: 12px;
        margin: 0;
        max-width: 400px;
      }
    `,
  ],
})
export class CubeImportComponent {
  readonly imported = output<{ cubeId: string; cards: CubeCard[] }>();

  private importService = inject(CubeImportService);

  protected mode = signal<ImportMode>('id');
  protected status = signal<ImportStatus>({ type: 'idle' });
  protected cubeId = '';
  protected cardList = '';

  importById(): void {
    const id = this.cubeId.trim();
    if (!id) {return;}
    this.status.set({ type: 'loading' });
    this.importService.importFromCubeId(id).subscribe({
      next: (cards) => {
        this.status.set({ type: 'idle' });
        this.imported.emit({ cubeId: id, cards });
      },
      error: (err: Error) => {
        this.status.set({ type: 'error', message: err.message });
      },
    });
  }

  importFromList(): void {
    const raw = this.cardList.trim();
    if (!raw) {return;}
    this.status.set({ type: 'loading' });
    this.importService.importFromCardNames(raw).subscribe({
      next: (cards) => {
        this.status.set({ type: 'idle' });
        this.imported.emit({ cubeId: 'custom', cards });
      },
      error: (err: Error) => {
        this.status.set({ type: 'error', message: err.message });
      },
    });
  }
}
