Let me check the frontend setup first.

Read [](file:///Users/wolthuis/coding/mtg-utils/apps/playtester-frontend/src/main.ts)

Read [](file:///Users/wolthuis/coding/mtg-utils/apps/playtester-frontend/src/app/app.ts)

Read [](file:///Users/wolthuis/coding/mtg-utils/apps/playtester-frontend/src/app/app.config.ts)

Read [](file:///Users/wolthuis/coding/mtg-utils/package.json#1-1), lines 1 to 50

Searched for text `tailwind` (`**/styles.css`), 1 result

Read [](file:///Users/wolthuis/coding/mtg-utils/apps/playtester-frontend/src/styles.css)

Angular 21, Tailwind v4, standalone components. Here's how a `BoardSectionComponent` would look — it's recursive, so each section renders itself and its children:

```typescript
import { Component, computed, input } from '@angular/core';
import { Section, SectionLayout } from '@mtg-utils/model-playtester';

@Component({
  selector: 'pt-board-section',
  standalone: true,
  imports: [BoardSectionComponent],
  template: `
    <div class="relative min-h-0 min-w-0" [style]="containerStyle()">
      @for (child of section().sections; track child.id) {
        <pt-board-section [section]="child" />
      }

      <!-- Leaf section: render card slot or section content -->
      @if (section().sections.length === 0) {
        <ng-content />
      }
    </div>
  `,
})
export class BoardSectionComponent {
  section = input.required<Section>();

  containerStyle = computed(() => {
    const layout = this.section().layout;
    return this.buildGridStyle(layout);
  });

  private buildGridStyle(layout: SectionLayout): Record<string, string> {
    const style: Record<string, string> = {};

    // Placement in parent grid
    if (layout.gridArea) {
      style['grid-area'] = layout.gridArea;
    }

    // This section defines a grid for its children
    if (layout.gridTemplate) {
      style['display'] = 'grid';
      style['grid-template-columns'] = layout.gridTemplate.columns;
      style['grid-template-rows'] = layout.gridTemplate.rows;

      if (layout.gridTemplate.areas) {
        style['grid-template-areas'] = layout.gridTemplate.areas.join(' ');
      }
    }

    if (layout.gap) {
      style['gap'] = layout.gap;
    }
    if (layout.minWidth) {
      style['min-width'] = layout.minWidth;
    }
    if (layout.minHeight) {
      style['min-height'] = layout.minHeight;
    }

    return style;
  }
}
```

And the parent `BoardComponent` that kicks off the recursion:

```typescript
import { Component, computed, input } from '@angular/core';
import { Board } from '@mtg-utils/model-playtester';
import { BoardSectionComponent } from './board-section.component';

@Component({
  selector: 'pt-board',
  standalone: true,
  imports: [BoardSectionComponent],
  template: `
    <div class="h-full w-full" [style]="boardStyle()">
      @for (section of board().sections; track section.id) {
        <pt-board-section [section]="section" />
      }
    </div>
  `,
})
export class BoardComponent {
  board = input.required<Board>();

  boardStyle = computed(() => {
    const layout = this.board().layout;
    const style: Record<string, string> = { display: 'grid' };

    if (layout.gridTemplate) {
      style['grid-template-columns'] = layout.gridTemplate.columns;
      style['grid-template-rows'] = layout.gridTemplate.rows;
      if (layout.gridTemplate.areas) {
        style['grid-template-areas'] = layout.gridTemplate.areas.join(' ');
      }
    }
    if (layout.gap) {
      style['gap'] = layout.gap;
    }

    return style;
  });
}
```

**How it works:**

1. **`BoardComponent`** applies the top-level `Board.layout` as a CSS grid on the root `<div>`, then loops over top-level sections.
2. **`BoardSectionComponent`** is recursive — it reads `section().layout` and builds an inline style object:
   - `gridArea` → places itself in the parent grid
   - `gridTemplate` → makes itself a grid container for its children
   - Recurses into `section().sections`
3. Leaf sections (no children) project content via `<ng-content />` — this is where you'd render cards from `CardState.cardOrder[sectionId]`.

**Example data → resulting grid:**

```typescript
const board: Board = {
  layout: {
    gridTemplate: { columns: '1fr 2fr 1fr', rows: 'auto 1fr', areas: ['"deck play market"', '"hand hand hand"'] },
    gap: '8px',
  },
  sections: [
    { id: 'deck', type: SECTION_TYPE.DECK, layout: { gridArea: 'deck' }, sections: [], ownerId: 'p1' },
    { id: 'play', type: SECTION_TYPE.PLAY_AREA, layout: { gridArea: 'play' }, sections: [], ownerId: 'p1' },
    { id: 'market', type: SECTION_TYPE.MARKET, layout: { gridArea: 'market' }, sections: [], ownerId: 'p1' },
    { id: 'hand', type: SECTION_TYPE.HAND, layout: { gridArea: 'hand' }, sections: [], ownerId: 'p1' },
  ],
};
```

Produces this grid:

```
┌──────────┬────────────────────┬──────────┐
│   deck   │       play         │  market  │
├──────────┴────────────────────┴──────────┤
│                  hand                     │
└───────────────────────────────────────────┘
```

The key insight: `[style]` binding with a `Record<string, string>` is Angular's built-in way to apply multiple dynamic styles cleanly — no Tailwind needed for the grid layout itself since these values are fully dynamic. Tailwind is useful for the static utility classes (`h-full`, `w-full`, `relative`, etc.).
