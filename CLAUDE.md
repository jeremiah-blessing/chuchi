# Claude Guide for Chochi

Concise pointers for Claude Code when working in this repo.

## Layout

- `language/` — Langium 3.3 grammar + generator + language-server worker.
  - Grammar: `src/language/chochi.langium`
  - Scene generator: `src/language/chochi-generator.ts`
  - Validator: `src/language/chochi-validator.ts`
  - Browser entry (LSP worker): `src/language/main-browser.ts`
  - Tests: `test/{parsing,linking,validating,generator}`
- `frontend/` — React + Vite + React Three Fiber.
  - Editor wiring: `src/Editor/{setupClassic.ts, setupCommon.ts, syntax.ts, theme.ts, Editor.tsx}`
  - Scene types: `src/types.ts`
  - Simulation (pure): `src/Player/simulation.ts`
  - Animation timeline: `src/Player/robotAnimation.ts`
  - 3D view: `src/Player/{Player.tsx, Warehouse.tsx, sceneObjects.tsx}`
  - Theme context: `src/theme.ts`

## Pipeline

`editor text → Langium parse → validator → generator → $scene JSON →
frontend simulate() → GSAP timeline → 3D render`

The worker is built from `language/` and dropped at
`frontend/public/chochiWorker.js`. Regenerate with
`npm run generate:worker` whenever you change the grammar, generator,
validator, or any `language/src/**` TypeScript.

## Rules of thumb

- **Grammar changes require regeneration.** After editing `chochi.langium`
  or anything in `language/src/language/*.ts`, run
  `npm run generate:worker` before the frontend will pick up new
  behavior.
- **Scene contract lives in two places.** `frontend/src/types.ts`
  describes the shape the frontend expects. The Langium side emits it in
  `chochi-generator.ts`. Keep them aligned when adding fields.
- **Simulation is pure.** Don't leak GSAP, React, or Three into
  `simulation.ts`. It's covered by unit tests and should stay trivially
  testable.
- **Animation is orchestration only.** `robotAnimation.ts` composes GSAP
  timelines from the simulation output. It should never re-derive robot
  state.
- **Monaco tokens are namespaced.** Tokens use `*.chochi` suffixes (e.g.
  `keyword.command.chochi`) so the custom theme in
  `frontend/src/Editor/theme.ts` can color them without colliding with
  built-in themes.
- **Themes apply post-init.** The editor registers
  `chochi-dark` / `chochi-light` and calls `monaco.editor.setTheme` after
  `wrapper.initAndStart`, because themes registered in editor options
  resolve too early.

## Commands

```bash
npm install
npm run generate:worker
npm --workspace frontend run dev
npm --workspace frontend run build
npm --workspace frontend run test
npm --workspace language run test
```

Tests are Vitest 2 (frontend is pinned to v2 due to Vite 6 compat).

## Conventions

- TypeScript target ES2022 (we use `Array.prototype.at`).
- TDD preferred for `simulation.ts` and grammar changes; both sides have
  fast test suites.
- Prettier via lint-staged on commit — no manual formatting runs needed.
- Do not write to `language/src/language/generated/` — it is produced by
  `langium generate`.

## External-facing caveats

- Vite `base` is `/chochi`. GitHub Pages deploy expects the remote repo
  to be named `chochi`. If the remote is still `chuchi`, Pages URLs and
  the worker fetch path will not line up.
- The `chuchi` directory name on the local filesystem is unrelated to
  runtime behavior; renaming it is a manual shell / git remote action.
