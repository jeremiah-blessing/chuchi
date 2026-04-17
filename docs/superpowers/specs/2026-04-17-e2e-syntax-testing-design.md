# E2E Syntax Testing Design

**Date:** 2026-04-17
**Status:** Approved

## Goal

Automatically generate Chochi language programs (valid and invalid), feed them into the running frontend via Playwright, and verify that:

- LSP validation errors appear as Monaco editor markers
- Simulation runtime errors appear as a red error banner in the UI
- No unexpected console errors occur

## Architecture

```
e2e/
  package.json                  # npm workspace, depends on @playwright/test
  playwright.config.ts          # base URL, browser, timeouts, webServer
  tsconfig.json
  GENERATE-TEST-PROGRAMS.md     # language reference + LLM generation prompt
  fixtures/
    static.json                 # 15 hand-curated edge case programs
    generated.json              # 20-35 LLM-generated programs (committed)
  tests/
    chochi-e2e.spec.ts          # single parameterized Playwright test
  scripts/
    merge-fixtures.ts           # merges static + generated into one array
```

### Workspace Setup

`e2e` is added to the root `package.json` workspaces array alongside `frontend` and `language`. Dependencies are installed via `npm install` at the root.

### Fixture Format

Each fixture is a JSON object:

```json
{
  "name": "descriptive_snake_case_name",
  "category": "valid" | "parse-error" | "simulation-error",
  "description": "Human-readable explanation of what this tests",
  "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\n...",
  "expectedErrors": ["Optional array of expected error message substrings"],
  "expectedError": "Optional single expected simulation error substring"
}
```

- `expectedErrors` is used for `parse-error` category (matched against Monaco marker messages)
- `expectedError` is used for `simulation-error` category (matched against the error banner text)
- Both fields are optional; when present, the test asserts the messages contain those substrings

## Frontend Changes

5 `data-testid` attributes added across 2 files. No behavior changes.

### Player.tsx

| Element                                                 | `data-testid`        |
| ------------------------------------------------------- | -------------------- |
| Placeholder div ("Edit a program to see the warehouse") | `player-placeholder` |
| Simulation error `<code>` element                       | `simulation-error`   |
| Command status bar wrapper                              | `command-status`     |
| Top-level viewport div wrapping the Canvas              | `player-viewport`    |

### Editor.tsx

| Element              | `data-testid`      |
| -------------------- | ------------------ |
| Editor container div | `editor-container` |

## Playwright Test Flow

One parameterized test iterates over all fixtures (static + generated merged):

```
1. Navigate to localhost (Vite dev server)
2. Wait for Monaco editor to initialize
3. Set editor content via page.evaluate:
     monaco.editor.getEditors()[0].setValue(code)
4. Wait for LSP to process (poll for marker count stability, ~2-3s)
5. Branch on category:

   IF "valid":
     - Assert: monaco marker count === 0
     - Assert: [data-testid="player-placeholder"] is NOT visible
     - Assert: [data-testid="simulation-error"] is NOT visible
     - Assert: [data-testid="player-viewport"] is visible

   IF "parse-error":
     - Assert: monaco marker count >= 1
     - Assert: [data-testid="player-placeholder"] is visible
     - If expectedErrors provided, assert marker messages contain them

   IF "simulation-error":
     - Assert: monaco marker count === 0
     - Assert: [data-testid="simulation-error"] is visible
     - If expectedError provided, assert error text contains it

7. ALWAYS: Assert console.error count === 0
```

### Console Error Capture

At the start of each test, register listeners:

- `page.on('console', msg)` -- collect messages with type `'error'`
- `page.on('pageerror', err)` -- collect uncaught exceptions

At the end of each test, assert both collections are empty.

### Monaco Marker Access

Markers are read via:

```ts
page.evaluate(() => {
  const monaco = (window as any).monaco;
  return monaco.editor.getModelMarkers({}).map((m: any) => ({
    message: m.message,
    severity: m.severity,
  }));
});
```

Monaco may need to be exposed on `window` during initialization if not already accessible. This will be verified during implementation and a one-line assignment added to `setupClassic.ts` if needed.

### Dev Server

Playwright's `webServer` config starts the Vite dev server automatically:

```ts
webServer: {
  command: 'npm --workspace frontend run dev',
  port: 5173,
  reuseExistingServer: !process.env.CI,
}
```

## Playwright Configuration

```ts
// playwright.config.ts
{
  testDir: './tests',
  timeout: 30_000,           // per-test timeout
  retries: 1,                // retry once for flakiness
  use: {
    baseURL: 'http://localhost:5173/chochi',
    browserName: 'chromium',
  },
  webServer: { ... }
}
```

Base URL includes `/chochi` to match the Vite `base` config.

## Static Fixtures (15 programs)

### Valid (5)

1. **minimal_valid** -- warehouse + robot + one goTo task
2. **full_featured** -- all sections, all 8 command types used
3. **unusual_section_order** -- tasks before warehouse, robot last
4. **with_comments** -- single-line and multi-line comments throughout
5. **multiple_tasks** -- 3 tasks that flatten in declaration order

### Parse/Validation Errors (6)

6. **missing_warehouse** -- no warehouse section
7. **missing_robot** -- no robot section
8. **missing_tasks** -- no tasks section
9. **robot_out_of_bounds** -- robot start position outside warehouse grid
10. **duplicate_name** -- same name used for an object and a waypoint
11. **pickup_targets_shelf** -- pickup referencing a shelf (semantic type error)

### Simulation Errors (4)

12. **pickup_wrong_location** -- pickup when robot is not at the package
13. **goto_crosses_obstacle** -- goTo path traverses a blocked cell
14. **drop_nothing** -- drop when robot is not carrying anything
15. **charge_no_charger** -- charge when robot is not at a charger

## Generated Fixtures (20-35 programs)

Produced by feeding `GENERATE-TEST-PROGRAMS.md` to any LLM. The prompt instructs the model to:

- Produce 20-35 programs distributed across all three categories
- Vary warehouse sizes (3x3 to 20x15)
- Mix all object kinds (shelf, package, charger) and command types
- Cover different validation rules for parse-error programs
- Cover different runtime failures for simulation-error programs
- Use realistic identifier names
- Output valid JSON matching the fixture schema

The output is saved as `e2e/fixtures/generated.json` and committed. Regenerate on demand when the grammar changes.

## Generation Prompt File

`e2e/GENERATE-TEST-PROGRAMS.md` is a single self-contained Markdown file with:

1. **Language specification** -- full grammar, syntax rules, validation rules, simulation runtime errors (content from the current `CHOCHI-LANGUAGE-REFERENCE.md`, which is deleted)
2. **Output format specification** -- JSON schema for the fixture array
3. **Output destination** -- explicitly instructs the LLM to write the generated JSON to `e2e/fixtures/generated.json`. This means CLI tools like Claude Code can write the file directly without manual copy/paste.
4. **Generation instructions** -- distribution, variety, and naming guidelines

### Usage with Claude Code CLI

```bash
cd /path/to/chuchi
claude -p "$(cat e2e/GENERATE-TEST-PROGRAMS.md)"
```

Because the prompt includes the output path, Claude Code will write `e2e/fixtures/generated.json` directly. No manual copy/paste needed.

## File Changes Summary

| Action | File                                                                       |
| ------ | -------------------------------------------------------------------------- |
| Create | `e2e/package.json`                                                         |
| Create | `e2e/playwright.config.ts`                                                 |
| Create | `e2e/tsconfig.json`                                                        |
| Create | `e2e/GENERATE-TEST-PROGRAMS.md`                                            |
| Create | `e2e/fixtures/static.json`                                                 |
| Create | `e2e/tests/chochi-e2e.spec.ts`                                             |
| Create | `e2e/scripts/merge-fixtures.ts`                                            |
| Edit   | `frontend/src/Player/Player.tsx` (add 4 data-testid)                       |
| Edit   | `frontend/src/Editor/Editor.tsx` (add 1 data-testid)                       |
| Edit   | `package.json` (add "e2e" to workspaces)                                   |
| Edit   | `frontend/src/Editor/setupClassic.ts` (expose monaco on window, if needed) |
| Delete | `CHOCHI-LANGUAGE-REFERENCE.md` (content moves to e2e/)                     |

## Commands

```bash
npm install                              # installs Playwright in e2e workspace
npx --workspace e2e playwright install   # downloads browser binaries
npm --workspace e2e run test             # runs Playwright tests
```
