# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository at a glance

Nx 22 monorepo containing:

- `libs/engine-core` — Magic: the Gathering rules engine (pure, no I/O).
- `libs/engine-protocol` — wire types shared between server and clients.
- `apps/engine-server` — Node app hosting the engine over WebSockets (`ws`).
- `apps/mtg-trader` — Angular 21 SPA. **Unrelated to the engine.** It is not the game UI and must not be wired to the engine-server. Treat the two halves of the repo as independent projects.

Path aliases (set in `tsconfig.base.json`): `@mtg-utils/engine-core`, `@mtg-utils/engine-protocol`. Always import via aliases across project boundaries.

## Common commands

The most-used flows are wrapped as npm scripts; everything below also has a direct `npx nx …` equivalent.

```sh
npm run build           # build all three engine projects
npm test                # vitest across engine-core + engine-server
npm run serve           # nx serve engine-server (ws://localhost:8080; override PORT)
npm run repl -- --player p1 --name Alice --game g1
npm run repl:p1         # shortcut: REPL as p1/Alice/g1
npm run repl:p2         # shortcut: REPL as p2/Bob/g1
npm run serve:trader    # the Angular mtg-trader app (unrelated to the engine)
```

Direct Nx forms (use these for narrower targets):

```sh
npx nx run engine-core:test                          # one project
npx nx run engine-core:test -- -t "summoning-sick"   # single test by name
npx nx run engine-server:test                        # runs the 2-client WS smoke spec
npx nx run engine-server:build                       # esbuild bundle for engine-server only
```

In the REPL, `help()` prints the action shortcuts (`play("forest")`, `tap("forest", "G")`, `play("strike", { target: "opp" })`, `attack(["bears"])`, `block([["bears", "giant"]])`, `pass()`, `concede()`); `me()`/`hand()`/`bf()` print the current view.

## Engine architecture (load-bearing)

The engine is **event-driven end-to-end**. Read this section before touching anything in `libs/engine-core/src/lib/engine/`.

### The flow

```
Action  ─►  validate(state, action) ─►  GameEvent[]   (seed events; pure)
                                          │
                                          ▼
                              ┌─►  applyEvent(state, e) ─►  state'   (the ONLY mutator)
                              │     │
                              │     ▼
                              │   bus.notify(state', e)  ─►  more events (subscribers)
                              │     │
                              │     ▼
                              │   SBA pass: checkStateBasedActions(state) → events
                              │     (run to fixed point; cleanup_at_cleanup, deaths, losses)
                              │
                              └── queue drains
```

Public entrypoint: `engine.apply(state, action) → Result<{ state, events }, string>` from `lib/engine/run.ts`. The default wiring of subscribers and SBA checks lives in `lib/engine/default-engine.ts` — use `createDefaultEngine()` unless you have a reason not to.

### Rules

- **Never mutate `GameState`**. `applyEvent` returns a new object; everything else is read-only.
- **Subscribers and effect handlers return events; they never call `applyEvent` themselves.** This keeps the event log the single source of truth.
- **State is the only persistent record.** SBA reactions to one-shot events (concede, deck-out) need state to carry them — see `state.losers: PlayerId[]`. If a future feature can't be detected by inspecting `GameState` alone, add a field rather than reading the event log.
- **`step_advanced` is a meta-event.** The subscriber in `lib/engine/phases/advance-step.ts` emits the intrinsic events of the new step (untap permanents, draw card, compute combat damage, empty mana, etc.). `validate` for `pass_step` only emits the `step_advanced`; everything else is derived.
- **Cards are data, behavior is in handlers.** A `CardDefinition` has an optional `effects: Effect[]`. Handlers in `lib/cards/effects/handlers/` are keyed by `Effect.kind` via the registry in `effect-registry.ts`. New cards normally need only a catalog entry plus, if their effect kind is new, a handler.
- **`projectFor(state, playerId)` is the only path to the wire.** The server must never send raw `GameState` — it leaks opponent hand and library order.

### v0 scope

Sorcery-speed only — **there is no stack, no priority loop, no instants, no triggered/activated abilities**. The architecture leaves room for them (see `i-want-to-create-jaunty-quill.md` plan): a stack module would slot between `validate` and effect resolution; triggered abilities are subscribers registered on ETB and unregistered on LTB.

## TypeScript build quirks

- **engine-core and engine-protocol use TypeScript project references** with `composite: true`. Each has its own `outDir` and `tsBuildInfoFile` under `dist/out-tsc/libs/<name>/` — these must stay distinct, otherwise `tsc -b` errors with "Cannot write file because it will overwrite .tsbuildinfo".
- **engine-server's `tsconfig.json` explicitly sets `strict: true`** (plus `noImplicitOverride`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`). It must match engine-core's strictness or discriminated-union narrowing (`{ ok: true } | { ok: false; reason }`) breaks when esbuild typechecks engine-core sources through the path alias.
- **engine-protocol depends on engine-core's built `.d.ts`** (via the `references` entry in `tsconfig.lib.json`). `project.json` has `dependsOn: ["^build"]` so Nx builds engine-core first.

## Testing notes

Tests are vitest. The engine-core spec files use a deterministic seed-based setup; tests that need a specific card in hand use the `ensureInHand` helper in `engine.spec.ts` to swap a top-of-library card into the hand rather than re-rolling the seed.

The engine-server smoke spec (`apps/engine-server/src/server/server.smoke.spec.ts`) calls `startWebSocketServer` in-process and drives it with two real `ws` clients in `beforeAll`/`afterAll`. Cross-cutting scripts should live inside the project they exercise — don't add files under a top-level `scripts/` directory, since nothing covers it with a `tsconfig.json` and editor path-alias resolution will break.
