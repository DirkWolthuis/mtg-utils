MTG Rules Engine — v0 Plan

Context

Build a Magic: the Gathering rules engine in TypeScript. The repo is an Nx workspace with three placeholders already scaffolded:

- libs/engine-core/ — has model types (GameState, CardInstance, ManaPool, Player, Phase/Step, CombatState) but no rules logic.
- libs/engine-protocol/ — empty stub.
- apps/engine-server/ — empty stub (console.log('Hello World')).

End goal: clients connect over WebSocket to a server hosting the engine and play 1v1 games. The engine only needs to support cards the user puts in their cubes; complex rules
are deferred until a card requires them.

v0 scope (chosen by the user):

- Sorcery-speed only — no stack.
- Lands, vanilla creatures, sorceries.
- Summoning sickness, declare attackers/blockers, combat damage, life loss, deck-out loss.
- Data-driven card definitions + an effect-handler registry.
- WebSocket transport between client and server.

Stack, instants, triggered abilities, and activated abilities are deliberately out of scope for v0; the architecture must make them straightforward to add in v1.

---

Architecture overview

Three-layer separation, all communicating through plain serializable data. Everything inside the engine is event-driven: actions never mutate state directly — they emit
events, events are the only thing that changes state, and subscribers react to events to emit more events. State is just a fold over the event log.

1.  engine-core (pure) — Event-driven rules engine:

- validate(state, action) → Result<GameEvent[], string> — turns a player action into the events it would produce.
- applyEvent(state, event) → state — pure, the only thing that mutates state.
- An event bus inside the engine dispatches each event to subscribers (state-based-action checker, keyword behaviors like lifelink, later: triggered abilities). Subscribers
  return more events, which are appended to the queue and drained until the queue is empty.
- Per-action result: { state, events: GameEvent[] } — the full ordered event log produced by that action, for clients to animate over and for tests to assert on.

2.  engine-protocol (pure types) — Discriminated-union message types for both directions on the wire. GameEvent is the central shared shape. Shared by client and server.
3.  engine-server — Thin WebSocket host. Owns connections, game rooms, and routing. Validates incoming messages, calls engine-core, projects per-player views, broadcasts event
    batches.

Nx path aliases @mtg-utils/engine-core and @mtg-utils/engine-protocol are already wired in tsconfig.base.json — use them directly.

---

v0 build order

Each step is independently testable. Don't move on until the previous one has vitest coverage.

Step 1 — Engine primitives (engine-core)

- Seeded RNG (mulberry32) and shuffle(array, rngState) in lib/engine/rng.ts and lib/engine/shuffle.ts. The seed and rngState fields are already on GameState.
- setupGame(decks, seed) → GameState in lib/engine/setup.ts: assigns card instance ids, shuffles libraries, draws 7, picks starting player by RNG. No mulligan in v0.
- A minimal sample card catalog under lib/cards/catalog/ (~6 cards is enough): two basic lands, two vanilla creatures, two simple sorceries. The user supplies real cube cards
  later.

Step 2 — Events, actions, and the event loop (engine-core)

This is the heart of the engine — build it carefully.

- GameEvent discriminated union in lib/engine/events.ts. v0 events: CardEnteredZone { cardId, from, to }, PermanentTapped, PermanentUntapped, ManaProduced, ManaSpent,
  DamageDealt { source, target, amount }, LifeChanged { playerId, delta, reason }, CreatureDied, LandPlayed, StepAdvanced { from, to }, TurnStarted, PlayerLost { playerId,
  reason }, GameEnded { winner }. Each event is plain serializable data — no functions.
- Action discriminated union in lib/actions/action.ts. v0 actions: TapLandForMana, PlayLand, CastCreature, CastSorcery, DeclareAttackers, DeclareBlockers, PassStep, Concede.
- validate(state, action) → Result<GameEvent[], string> in lib/engine/validate.ts: timing (right step, right player), cost legality, target legality, summoning sickness,
  "can't block flyers without flying/reach". On success it returns the seed events the action produces (e.g. CastSorcery → [ManaSpent, CardEnteredZone(hand→stack-skip),
  DamageDealt, CardEnteredZone(→graveyard)]).
- applyEvent(state, event) → state in lib/engine/apply-event.ts. Pure. One switch over event kind. The only place state changes. Tiny per-case logic — most events are one or
  two field updates.
- EventBus in lib/engine/event-bus.ts. Subscribers register with on(kind, handler). A handler receives (state, event) and returns more events. Subscribers cannot mutate
  state.
- The event loop in lib/engine/run.ts:
  a. Seed queue with the events returned by validate.
  b. Pop event, call applyEvent, append to output log.
  c. Notify subscribers; append any reaction events to the queue.
  d. After every event, run the SBA pass — it inspects state and pushes more events (CreatureDied, PlayerLost, GameEnded) until quiescent.
  e. Repeat until the queue is empty.
- Public entry point: apply(state, action) → { state, events } wraps validate + the loop. This is what the server calls.

This loop is what makes v1 triggered abilities a small change: each card's triggers register subscribers at ETB and unregister at LTB; they emit events that go on the same
queue.

Step 3 — Turn structure & SBAs (engine-core)

- Step advancement in lib/engine/phases/advance-step.ts — PassStep emits a StepAdvanced event; an internal subscriber on StepAdvanced emits the step's intrinsic events (e.g.
  entering untap emits PermanentUntapped for each of the active player's tapped permanents; entering draw emits a draw event; entering cleanup emits mana-pool-empty events).
  Sequence: untap → upkeep → draw → main1 → begin_combat → declare_attackers → declare_blockers → combat_damage → end_combat → main2 → end → cleanup. Turn-1 first player skips
  draw (configurable).
- Combat in lib/engine/phases/combat.ts: DeclareAttackers/DeclareBlockers produce tap/assignment events; combat damage emits DamageDealt events (per attacker → defender /
  blocker pairing). v0 keywords already declared in types.ts: haste, flying, trample, vigilance, lifelink, deathtouch, first_strike. First strike = an extra damage sub-step;
  trample = "lethal assignment then excess to defender"; lifelink is a subscriber on DamageDealt that emits LifeChanged.
- State-based actions in lib/engine/state-based-actions.ts: a single subscriber that runs after every event. Inspects state and emits CreatureDied (zone change to graveyard),
  PlayerLost (≤ 0 life, drew from empty library, deathtouch lethal), GameEnded (one player left). SBAs never mutate — they only emit events; the apply-event step does the
  actual change.

Step 4 — Data-driven cards & effects (engine-core)

- Effect discriminated union in lib/cards/effects/effect-types.ts. v0 effects (only what sample sorceries need): DealDamageToAny, DrawCards, GainLife. Add more only when a
  real card needs them.
- Effect registry in lib/cards/effects/effect-registry.ts: Map<EffectKind, (state, ctx, params) → GameEvent[]>. Handlers return events, never mutate. Handlers live one per
  file under effects/handlers/.
- Extend CardDefinition (lib/cards/card-definition.ts) with an optional effects: Effect[] field. In v0, CastSorcery validation calls each effect's handler and concatenates
  their events into the action's seed events. In v1 these same handlers get called by the stack resolver — the signature doesn't change.
- Catalog cards (e.g. lib/cards/catalog/lightning-strike.ts) declare effects by descriptor — no imperative behavior in the card files themselves.
- Keyword behaviors (lifelink, deathtouch, trample) are implemented as built-in event subscribers, not effects on the card — they live in lib/engine/keywords/ and inspect
  CardInstance.keywords when reacting to events.

Step 5 — Per-player view projection (engine-core)

- projectFor(state, playerId) → PlayerView in lib/view/player-view.ts: replaces opponent's hand and both libraries with counts only, hides upcoming-library order, keeps
  battlefield/graveyard/exile fully visible. The server sends this — never the raw GameState.

Step 6 — Protocol (engine-protocol)

Replace the stub engineProtocol() with:

- Re-export GameEvent and Action types from @mtg-utils/engine-core so client and server share one definition.
- ClientMessage union in lib/messages/client-to-server.ts: JoinGame { gameId, playerId, deck }, SubmitAction { action }, LeaveGame.
- ServerMessage union in lib/messages/server-to-client.ts: StateSync { view } (full view after join/resync), EventBatch { events, viewPatch } (the events from one action,
  plus the resulting per-player view), RejectedAction { reason }, GameOver { winner }, Error { message }. EventBatch is the primary push — clients animate events and reconcile
  against viewPatch.
- Hand-rolled type guards in lib/messages/guards.ts — skip zod for v0, add later if the message shapes grow.
- Re-export everything from src/index.ts.

Step 7 — WebSocket server (engine-server)

Add ws + @types/ws to devDependencies. Then in apps/engine-server/src/:

- main.ts — read PORT env (default 8080), start the WS server, log ready.
- server/ws-server.ts — wraps WebSocketServer, parses incoming JSON, validates via protocol guards, routes to a GameRoom. Event-driven by nature (ws itself is event-driven).
- server/game-room.ts — owns one GameState, maps PlayerId → WebSocket, calls apply(state, action), then for each connected player projects a view and broadcasts an
  EventBatch. Keeps an in-memory event log per game so a reconnecting client can replay.
- server/room-registry.ts — in-memory Map<GameId, GameRoom> for v0. Persistence is out of scope.
- server/session.ts — per-connection state: which playerId, which gameId, auth is playerId echoed back from the client for now (no real auth in v0).

---

Directory layout (target)

libs/engine-core/src/lib/
model/ # types.ts, game-state.ts (exist)
cards/
card-definition.ts (exists, extend with effects)
effects/
effect-types.ts
effect-registry.ts
handlers/{deal-damage,draw-cards,gain-life}.ts
catalog/{index,forest,mountain,grizzly-bears,...}.ts
actions/action.ts
engine/
rng.ts shuffle.ts setup.ts
events.ts apply-event.ts event-bus.ts run.ts validate.ts
state-based-actions.ts
keywords/{lifelink,deathtouch,trample,first-strike,flying,vigilance,haste}.ts
phases/{advance-step,combat}.ts
view/player-view.ts

libs/engine-protocol/src/lib/messages/
client-to-server.ts server-to-client.ts guards.ts

apps/engine-server/src/
main.ts
server/{ws-server,game-room,room-registry,session}.ts

---

Key design points

- Event-driven, end to end. Actions emit events. Events — and only events — change state via applyEvent. Subscribers react to events by emitting more events. State is a fold
  over the event log. This is the load-bearing architectural choice and every other design point flows from it.
- State is immutable. applyEvent returns a new GameState; no in-place mutation anywhere. Cheap structural sharing on the Record<…> maps is fine for v0.
- Subscribers are pure functions, not classes. A subscriber is (state, event) → GameEvent[]. No hidden state. SBAs, keyword behaviors, lifelink, and eventually triggered
  abilities are all the same shape.
- The event log is the wire format. Clients receive EventBatches and apply the same applyEvent against their PlayerView to keep in sync — the engine code is reusable on the
  client side. A periodic StateSync recovers from any drift.
- Effects are descriptors, not closures. A CardDefinition is JSON-serializable. Behavior lives in handlers looked up by kind. Cards can eventually be loaded from a data file
  or DB without code changes.
- One-way information flow. Clients never receive GameState — only PlayerView. This prevents accidental leakage of opponent hand / library order. Events that reference hidden
  cards are rewritten (or omitted) by the view projector before they cross the wire.
- v1-ready seams. A stack module slots in as: instead of CastSorcery immediately emitting effect events, it emits SpellPutOnStack; a stack resolver subscriber later emits the
  effect events on resolution. Triggered abilities are subscribers that register when a permanent enters the battlefield and emit AbilityTriggered/PutOnStack events. Activated
  abilities are new actions that produce the same stack events. None of this is built in v0, but the loop accommodates it without changes.

---

Verification

- Unit tests (vitest) in each lib — nx test engine-core. At minimum cover: setup determinism (same seed → same shuffle), applyEvent for each event kind, the event loop
  quiescing correctly, tap-for-mana → cast creature → summoning sickness blocks attack, attack/block damage + first strike + trample + lifelink (assert via the emitted event
  sequence), lethal-damage SBA, 0-life loss, empty-library loss, sorcery effect dispatch. Asserting on the event log is more precise than asserting on the final state.
- End-to-end smoke: start the server (nx serve engine-server), connect two ws clients from a small scripts/ harness (Node script using ws), play a scripted 3-turn game,
  assert final GameOver event matches expectations.
- Manual: not required for v0 since the Angular client isn't being wired up in this slice — the test harness is the human-runnable check.

---

Out of scope for v0 (explicit)

- The stack, priority passes, instants.
- Triggered and activated abilities (beyond keyword-driven combat behaviors).
- Mulligans.
- Multiplayer beyond 2 players.
- Persistence, authentication, reconnection.
- Wiring the Angular mtg-trader app to the server — that's a separate slice once the protocol stabilizes.
