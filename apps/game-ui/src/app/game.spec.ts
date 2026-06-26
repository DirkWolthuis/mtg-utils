import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { PlayerView } from '@mtg-utils/engine-core';
import { GameStatus, Step } from '@mtg-utils/engine-core';
import { ConnectionStatus, EngineWsService } from './engine-ws.service';
import { Game } from './game';
import { RuntimeConfigService } from './runtime-config.service';

const minimalView = (): PlayerView =>
  ({
    forPlayer: 'p1' as never,
    gameId: 'g1' as never,
    status: GameStatus.Active,
    turn: 1,
    step: Step.Main1,
    activePlayer: 'p1' as never,
    priorityPlayer: 'p1' as never,
    winner: null,
    combat: {
      attackers: [],
      blockers: [],
      blockerAssignments: [],
      attackersDeclared: false,
      blockersDeclared: false,
    },
    battlefield: [],
    stack: [],
    cards: {},
    self: {
      id: 'p1' as never,
      name: 'Player 1',
      life: 20,
      library: [],
      hand: [],
      graveyard: [],
      exile: [],
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      landsPlayedThisTurn: 0,
    },
    opponent: {
      id: 'p2' as never,
      name: 'Player 2',
      life: 20,
      libraryCount: 0,
      handCount: 0,
      graveyard: [],
      exile: [],
      manaPool: { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 },
      landsPlayedThisTurn: 0,
    },
  }) as PlayerView;

describe('Game – skip turn toggle', () => {
  let wsService: {
    view: ReturnType<typeof signal<PlayerView | null>>;
    connectionStatus: ReturnType<typeof signal<ConnectionStatus>>;
    lastRejection: ReturnType<typeof signal<string | null>>;
    log: ReturnType<typeof signal<string[]>>;
    submit: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    const viewSignal = signal<PlayerView | null>(null);
    const statusSignal = signal<ConnectionStatus>(ConnectionStatus.Active);
    const rejectionSignal = signal<string | null>(null);

    wsService = {
      view: viewSignal,
      connectionStatus: statusSignal,
      lastRejection: rejectionSignal,
      log: signal<string[]>([]),
      submit: vi.fn(),
      disconnect: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Game],
      providers: [
        { provide: EngineWsService, useValue: wsService },
        { provide: RuntimeConfigService, useValue: { engineWsUrl: signal('ws://localhost:8080') } },
      ],
    }).compileComponents();
  });

  const getSkipButton = (fixture: ReturnType<typeof TestBed.createComponent<Game>>) =>
    fixture.debugElement
      .queryAll(By.css('button'))
      .find((b) => (b.nativeElement as HTMLButtonElement).textContent?.includes('Skip Turn'))
      ?.nativeElement as HTMLButtonElement | undefined;

  it('activates skipping on first click', async () => {
    const fixture = TestBed.createComponent(Game);
    wsService.view.set(minimalView());
    await fixture.whenStable();

    const btn = getSkipButton(fixture);
    expect(btn).toBeTruthy();
    expect(btn!.classList.contains('active')).toBe(false);

    btn!.click();
    await fixture.whenStable();

    expect(btn!.classList.contains('active')).toBe(true);
    expect(btn!.textContent).toContain('(active)');
  });

  it('deactivates skipping on second click', async () => {
    const fixture = TestBed.createComponent(Game);
    wsService.view.set(minimalView());
    await fixture.whenStable();

    const btn = getSkipButton(fixture);
    btn!.click();
    await fixture.whenStable();
    expect(btn!.classList.contains('active')).toBe(true);

    btn!.click();
    await fixture.whenStable();
    expect(btn!.classList.contains('active')).toBe(false);
    expect(btn!.textContent).not.toContain('(active)');
  });
});
