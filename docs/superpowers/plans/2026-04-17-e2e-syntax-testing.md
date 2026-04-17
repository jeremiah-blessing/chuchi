# E2E Syntax Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Playwright E2E test suite that feeds generated Chochi programs into the Monaco editor and verifies LSP markers, simulation error banners, and console error absence.

**Architecture:** An `e2e` npm workspace with Playwright, static + LLM-generated JSON fixture files, and a single parameterized test spec. The frontend gets 5 `data-testid` attributes for robust selectors. A self-contained Markdown prompt file enables LLM-based fixture generation.

**Tech Stack:** Playwright, TypeScript, npm workspaces

---

### Task 1: Add data-testid attributes to frontend

**Files:**

- Modify: `frontend/src/Player/Player.tsx:102-112` (placeholder div)
- Modify: `frontend/src/Player/Player.tsx:117` (viewport div)
- Modify: `frontend/src/Player/Player.tsx:118-144` (command status)
- Modify: `frontend/src/Player/Player.tsx:147-165` (simulation error)
- Modify: `frontend/src/Editor/Editor.tsx:40-47` (editor container)

- [ ] **Step 1: Add data-testid to the placeholder div in Player.tsx**

In `frontend/src/Player/Player.tsx`, find the placeholder return (line 102-111):

```tsx
if (!scene || !simulation) {
  return (
    <div
      className={`w-full h-full flex items-center justify-center ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      Edit a program to see the warehouse.
    </div>
  );
}
```

Change the `<div` opening to add the test ID:

```tsx
if (!scene || !simulation) {
  return (
    <div
      data-testid="player-placeholder"
      className={`w-full h-full flex items-center justify-center ${
        isDark ? 'text-gray-400' : 'text-gray-500'
      }`}
    >
      Edit a program to see the warehouse.
    </div>
  );
}
```

- [ ] **Step 2: Add data-testid to the viewport div in Player.tsx**

Find the top-level viewport div (line 117):

```tsx
    <div className="w-full h-full relative">
```

Change to:

```tsx
    <div data-testid="player-viewport" className="w-full h-full relative">
```

- [ ] **Step 3: Add data-testid to the command status bar in Player.tsx**

Find the command status outer div (line 119):

```tsx
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
```

Change to:

```tsx
        <div data-testid="command-status" className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
```

- [ ] **Step 4: Add data-testid to the simulation error code element in Player.tsx**

Find the error `<code>` element (line 157-162):

```tsx
<code
  className={`text-sm font-mono ${isDark ? 'text-red-100' : 'text-red-800'}`}
>
  {runtimeError}
</code>
```

Change to:

```tsx
<code
  data-testid="simulation-error"
  className={`text-sm font-mono ${isDark ? 'text-red-100' : 'text-red-800'}`}
>
  {runtimeError}
</code>
```

- [ ] **Step 5: Add data-testid to the editor container in Editor.tsx**

In `frontend/src/Editor/Editor.tsx`, find the container div (line 41-46):

```tsx
<div
  className={`w-full h-full px-4 transition-colors duration-300 ${
    theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#fffffe]'
  }`}
  ref={containerRef}
/>
```

Change to:

```tsx
<div
  data-testid="editor-container"
  className={`w-full h-full px-4 transition-colors duration-300 ${
    theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#fffffe]'
  }`}
  ref={containerRef}
/>
```

- [ ] **Step 6: Expose monaco on window in setupClassic.ts**

In `frontend/src/Editor/setupClassic.ts`, after the monaco import on line 81:

```ts
const monaco = await import('monaco-editor');
monaco.editor.setTheme('chochi-dark');
```

Add one line to expose it on `window`:

```ts
const monaco = await import('monaco-editor');
(window as any).monaco = monaco;
monaco.editor.setTheme('chochi-dark');
```

- [ ] **Step 7: Verify frontend still works**

Run: `npm --workspace frontend run build`
Expected: Build succeeds with no errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/Player/Player.tsx frontend/src/Editor/Editor.tsx frontend/src/Editor/setupClassic.ts
git commit -m "feat: add data-testid attributes and expose monaco for E2E testing"
```

---

### Task 2: Create e2e workspace scaffold

**Files:**

- Create: `e2e/package.json`
- Create: `e2e/tsconfig.json`
- Create: `e2e/playwright.config.ts`
- Modify: `package.json` (root — add "e2e" to workspaces)

- [ ] **Step 1: Create e2e/package.json**

Create `e2e/package.json`:

```json
{
  "name": "e2e",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:debug": "playwright test --debug"
  },
  "devDependencies": {
    "@playwright/test": "^1.52.0"
  }
}
```

- [ ] **Step 2: Create e2e/tsconfig.json**

Create `e2e/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["tests/**/*.ts", "scripts/**/*.ts"]
}
```

- [ ] **Step 3: Create e2e/playwright.config.ts**

Create `e2e/playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173/chochi',
    browserName: 'chromium',
  },
  webServer: {
    command: 'npm --workspace frontend run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    cwd: '..',
  },
});
```

- [ ] **Step 4: Add "e2e" to root workspaces**

In root `package.json`, find:

```json
  "workspaces": [
    "frontend",
    "language"
  ],
```

Change to:

```json
  "workspaces": [
    "frontend",
    "language",
    "e2e"
  ],
```

- [ ] **Step 5: Install dependencies and Playwright browsers**

Run: `npm install`
Expected: Installs `@playwright/test` in the e2e workspace.

Run: `npx --workspace e2e playwright install chromium`
Expected: Downloads Chromium browser binary for Playwright.

- [ ] **Step 6: Commit**

```bash
git add e2e/package.json e2e/tsconfig.json e2e/playwright.config.ts package.json package-lock.json
git commit -m "feat: scaffold e2e workspace with Playwright config"
```

---

### Task 3: Create static fixtures

**Files:**

- Create: `e2e/fixtures/static.json`

- [ ] **Step 1: Create e2e/fixtures/ directory**

Run: `mkdir -p e2e/fixtures`

- [ ] **Step 2: Create e2e/fixtures/static.json with all 15 fixtures**

Create `e2e/fixtures/static.json`:

```json
[
  {
    "name": "minimal_valid",
    "category": "valid",
    "description": "Smallest possible valid program: warehouse + robot + one task with one step",
    "code": "warehouse : size(3, 3)\nrobot : start at (0, 0) facing right\ntasks :\n  move : goTo(1, 1)"
  },
  {
    "name": "full_featured",
    "category": "valid",
    "description": "Uses all sections and all 8 command types",
    "code": "warehouse : size(10, 8)\nrobot : start at (0, 0) facing right\nobjects :\n  shelf shelfA at (3, 0)\n  package pkg1 at (5, 2)\n  charger dock at (0, 7)\nobstacles :\n  at (4, 4)\n  from (6, 6) to (6, 7)\nwaypoints :\n  home at (0, 0)\ntasks :\n  main :\n    goTo(pkg1)\n    pickup(pkg1)\n    goTo(shelfA)\n    load(shelfA)\n    turn(down)\n    goTo(shelfA)\n    unload(shelfA)\n    drop()\n    goTo(dock)\n    scan(dock)\n    charge()\n    goTo(home)"
  },
  {
    "name": "unusual_section_order",
    "category": "valid",
    "description": "Sections in non-standard order: tasks first, then objects, then warehouse, then robot",
    "code": "tasks :\n  t1 : goTo(1, 1)\nobjects :\n  shelf s1 at (2, 2)\nwarehouse : size(5, 5)\nrobot : start at (0, 0) facing up"
  },
  {
    "name": "with_comments",
    "category": "valid",
    "description": "Program with single-line and multi-line comments throughout",
    "code": "// This is a warehouse program\nwarehouse : size(5, 5)\n\n/* Robot starts\n   at the origin */\nrobot : start at (0, 0) facing right\n\n// A simple task\ntasks :\n  patrol : // patrol the grid\n    goTo(2, 2)\n    turn(left)\n    goTo(0, 0)"
  },
  {
    "name": "multiple_tasks",
    "category": "valid",
    "description": "Three separate tasks that flatten into one command sequence",
    "code": "warehouse : size(6, 6)\nrobot : start at (0, 0) facing right\nobjects :\n  package crate at (2, 0)\n  shelf storage at (4, 0)\ntasks :\n  fetch :\n    goTo(crate)\n    pickup(crate)\n  store :\n    goTo(storage)\n    load(storage)\n  returnToStart :\n    goTo(0, 0)\n    turn(down)"
  },
  {
    "name": "missing_warehouse",
    "category": "parse-error",
    "description": "No warehouse section — should produce validation error",
    "code": "robot : start at (0, 0) facing right\ntasks :\n  t : goTo(1, 1)",
    "expectedErrors": ["Missing required section 'warehouse'"]
  },
  {
    "name": "missing_robot",
    "category": "parse-error",
    "description": "No robot section — should produce validation error",
    "code": "warehouse : size(5, 5)\ntasks :\n  t : goTo(1, 1)",
    "expectedErrors": ["Missing required section 'robot'"]
  },
  {
    "name": "missing_tasks",
    "category": "parse-error",
    "description": "No tasks section — should produce validation error",
    "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right",
    "expectedErrors": ["Missing required section 'tasks'"]
  },
  {
    "name": "robot_out_of_bounds",
    "category": "parse-error",
    "description": "Robot start position is outside the warehouse grid",
    "code": "warehouse : size(3, 3)\nrobot : start at (10, 10) facing right\ntasks :\n  t : goTo(1, 1)",
    "expectedErrors": ["outside warehouse bounds"]
  },
  {
    "name": "duplicate_name",
    "category": "parse-error",
    "description": "Same name used for an object and a waypoint",
    "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\nobjects :\n  shelf alpha at (1, 0)\nwaypoints :\n  alpha at (2, 2)\ntasks :\n  t : goTo(1, 1)",
    "expectedErrors": ["Duplicate name 'alpha'"]
  },
  {
    "name": "pickup_targets_shelf",
    "category": "parse-error",
    "description": "pickup command references a shelf instead of a package",
    "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\nobjects :\n  shelf myShelf at (2, 0)\ntasks :\n  t : pickup(myShelf)",
    "expectedErrors": ["pickup requires a package"]
  },
  {
    "name": "pickup_wrong_location",
    "category": "simulation-error",
    "description": "Robot tries to pickup a package but is not at the package location",
    "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\nobjects :\n  package box at (3, 3)\ntasks :\n  t : pickup(box)",
    "expectedError": "not at package"
  },
  {
    "name": "goto_crosses_obstacle",
    "category": "simulation-error",
    "description": "goTo path must cross through an obstacle cell",
    "code": "warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\nobstacles :\n  at (2, 0)\ntasks :\n  t : goTo(4, 0)",
    "expectedError": "obstacle"
  },
  {
    "name": "drop_nothing",
    "category": "simulation-error",
    "description": "Robot tries to drop but is not carrying anything",
    "code": "warehouse : size(3, 3)\nrobot : start at (0, 0) facing right\ntasks :\n  t : drop()",
    "expectedError": "nothing to drop"
  },
  {
    "name": "charge_no_charger",
    "category": "simulation-error",
    "description": "Robot tries to charge but is not on a charger cell",
    "code": "warehouse : size(3, 3)\nrobot : start at (0, 0) facing right\ntasks :\n  t : charge()",
    "expectedError": "not at any charger"
  }
]
```

- [ ] **Step 3: Commit**

```bash
git add e2e/fixtures/static.json
git commit -m "feat: add 15 static E2E test fixtures"
```

---

### Task 4: Create the Playwright test spec

**Files:**

- Create: `e2e/tests/chochi-e2e.spec.ts`

- [ ] **Step 1: Create e2e/tests/ directory**

Run: `mkdir -p e2e/tests`

- [ ] **Step 2: Create e2e/tests/chochi-e2e.spec.ts**

Create `e2e/tests/chochi-e2e.spec.ts`:

```ts
import { test, expect, Page } from '@playwright/test';
import staticFixtures from '../fixtures/static.json' with { type: 'json' };
import { existsSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  name: string;
  category: 'valid' | 'parse-error' | 'simulation-error';
  description: string;
  code: string;
  expectedErrors?: string[];
  expectedError?: string;
}

function loadFixtures(): Fixture[] {
  const fixtures: Fixture[] = [...(staticFixtures as Fixture[])];
  const generatedPath = resolve(__dirname, '../fixtures/generated.json');
  if (existsSync(generatedPath)) {
    const raw = readFileSync(generatedPath, 'utf-8');
    const generated = JSON.parse(raw) as Fixture[];
    fixtures.push(...generated);
  }
  return fixtures;
}

const fixtures = loadFixtures();

async function waitForMonacoReady(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const m = (window as any).monaco;
      return m && m.editor && m.editor.getEditors().length > 0;
    },
    { timeout: 15_000 }
  );
}

async function setEditorContent(page: Page, code: string): Promise<void> {
  await page.evaluate((c) => {
    const editor = (window as any).monaco.editor.getEditors()[0];
    editor.setValue(c);
  }, code);
}

async function waitForLspStability(page: Page): Promise<void> {
  // Wait for markers to stabilize: poll until the marker count stays
  // the same for 500ms, or give up after 5 seconds total.
  await page.waitForFunction(
    () => {
      const w = window as any;
      const markers = w.monaco.editor.getModelMarkers({});
      const count = markers.length;
      const prev = w.__e2eLastMarkerCount;
      const prevTime = w.__e2eLastMarkerTime;
      const now = Date.now();

      if (prev !== count) {
        w.__e2eLastMarkerCount = count;
        w.__e2eLastMarkerTime = now;
        return false;
      }
      return now - prevTime > 500;
    },
    { timeout: 5_000 }
  );
}

async function getMarkers(
  page: Page
): Promise<{ message: string; severity: number }[]> {
  return page.evaluate(() => {
    const m = (window as any).monaco;
    return m.editor.getModelMarkers({}).map((marker: any) => ({
      message: marker.message as string,
      severity: marker.severity as number,
    }));
  });
}

for (const fixture of fixtures) {
  test(`[${fixture.category}] ${fixture.name}: ${fixture.description}`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });

    await page.goto('/');
    await waitForMonacoReady(page);
    await setEditorContent(page, fixture.code);
    await waitForLspStability(page);

    const markers = await getMarkers(page);

    if (fixture.category === 'valid') {
      expect(
        markers,
        `Expected no markers for valid fixture "${fixture.name}", got: ${JSON.stringify(markers.map((m) => m.message))}`
      ).toHaveLength(0);

      await expect(page.getByTestId('player-placeholder')).not.toBeVisible();
      await expect(page.getByTestId('simulation-error')).not.toBeVisible();
      await expect(page.getByTestId('player-viewport')).toBeVisible();
    } else if (fixture.category === 'parse-error') {
      expect(
        markers.length,
        `Expected markers for parse-error fixture "${fixture.name}"`
      ).toBeGreaterThan(0);

      await expect(page.getByTestId('player-placeholder')).toBeVisible();

      if (fixture.expectedErrors) {
        const messages = markers.map((m) => m.message.toLowerCase());
        for (const expected of fixture.expectedErrors) {
          const found = messages.some((msg) =>
            msg.includes(expected.toLowerCase())
          );
          expect(
            found,
            `Expected marker containing "${expected}" but got: ${JSON.stringify(markers.map((m) => m.message))}`
          ).toBe(true);
        }
      }
    } else if (fixture.category === 'simulation-error') {
      expect(
        markers,
        `Expected no markers for simulation-error fixture "${fixture.name}", got: ${JSON.stringify(markers.map((m) => m.message))}`
      ).toHaveLength(0);

      const errorElement = page.getByTestId('simulation-error');
      await expect(errorElement).toBeVisible({ timeout: 5_000 });

      if (fixture.expectedError) {
        const errorText = await errorElement.textContent();
        expect(errorText?.toLowerCase()).toContain(
          fixture.expectedError.toLowerCase()
        );
      }
    }

    // Always assert no unexpected console errors
    expect(
      consoleErrors,
      `Unexpected console errors for "${fixture.name}": ${JSON.stringify(consoleErrors)}`
    ).toHaveLength(0);
    expect(
      pageErrors,
      `Unexpected page errors for "${fixture.name}": ${JSON.stringify(pageErrors)}`
    ).toHaveLength(0);
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/chochi-e2e.spec.ts
git commit -m "feat: add parameterized Playwright E2E test spec"
```

---

### Task 5: Create the generation prompt file

**Files:**

- Create: `e2e/GENERATE-TEST-PROGRAMS.md`
- Delete: `CHOCHI-LANGUAGE-REFERENCE.md`

- [ ] **Step 1: Create e2e/GENERATE-TEST-PROGRAMS.md**

This file combines the full language reference with generation instructions. Create `e2e/GENERATE-TEST-PROGRAMS.md`:

````markdown
# Chochi Test Program Generator

You are generating test programs for the Chochi warehouse robot DSL. Read the language specification below, then generate test programs in the exact JSON format specified.

## Output Destination

Write the generated JSON array to this file:

**`e2e/fixtures/generated.json`**

Do not output the JSON to the console. Write it directly to the file above. If the file already exists, overwrite it entirely.

## Output Format

Write a JSON array where each element has this shape:

```json
{
  "name": "descriptive_snake_case_name",
  "category": "valid" | "parse-error" | "simulation-error",
  "description": "One sentence explaining what this program tests",
  "code": "the full Chochi program as a string with \\n for newlines",
  "expectedErrors": ["array of error message substrings, only for parse-error category"],
  "expectedError": "single error message substring, only for simulation-error category"
}
```
````

Field rules:

- `name`: unique snake_case identifier
- `category`: exactly one of `"valid"`, `"parse-error"`, or `"simulation-error"`
- `description`: one sentence
- `code`: the full Chochi source, with `\n` for newlines inside the JSON string
- `expectedErrors`: only include for `"parse-error"` category. Array of substrings that should appear in Monaco editor validation markers (case-insensitive match).
- `expectedError`: only include for `"simulation-error"` category. A substring that should appear in the simulation runtime error banner (case-insensitive match).

## Generation Instructions

Generate **25-35 programs** distributed as follows:

- **8-12 valid programs**: syntactically and semantically correct, simulation runs without error
- **8-12 parse-error programs**: trigger LSP validation errors (Monaco markers)
- **6-10 simulation-error programs**: parse and validate cleanly but fail during simulation

### Variety requirements

**For valid programs:**

- Vary warehouse sizes: small (3x3, 4x4), medium (8x6, 10x8), large (15x12, 20x15)
- Use all three object kinds: shelf, package, charger
- Use all 8 command types across the set: goTo (both coordinate and named forms), turn, pickup, drop, load, unload, scan, charge
- Include programs with: only required sections, all sections, multiple tasks, waypoints used as goTo targets, comments
- Use realistic identifier names (e.g., `warehouse_shelf_A`, `incomingPackage`, `chargingStation1`), not single letters

**For parse-error programs:**

- Cover different validation rules — don't repeat the same error type more than twice. Spread across:
  - Missing required sections (warehouse, robot, tasks)
  - Warehouse dimensions <= 0
  - Robot/object/waypoint/obstacle out of bounds
  - Robot on obstacle
  - Object on obstacle
  - Two objects at same coordinate
  - Duplicate names (object+waypoint, object+task, waypoint+task)
  - Unresolved references in goTo/pickup/load/unload/scan
  - Semantic type errors: pickup on shelf/charger, load on package/charger, unload on package/charger
  - goTo with out-of-bounds coordinates
- Each program should trigger at least one clear validation error
- Include the expected error message substring in `expectedErrors`

**For simulation-error programs:**

- These must parse and validate without any LSP errors — the error only occurs at runtime
- Cover different runtime failures:
  - goTo path crosses obstacle
  - goTo path leaves warehouse bounds (via named target at edge + manhattan path)
  - pickup when not at package location
  - pickup when already carrying
  - drop when not carrying
  - load when not at shelf
  - load when not carrying anything
  - unload when not at shelf
  - unload when already carrying
  - scan when not at object location
  - charge when not at charger
- Include the expected error message substring in `expectedError`

### Important constraints

- All `code` values must use `\n` for newlines (they're JSON strings)
- Coordinate form goTo uses: `goTo(x, y)` — named form uses: `goTo(name)`
- `goTo` is camelCase (not `goto` or `GoTo`)
- `drop()` and `charge()` take no arguments — parentheses are required
- Identifiers cannot be keywords: `warehouse`, `size`, `robot`, `start`, `at`, `facing`, `objects`, `obstacles`, `waypoints`, `tasks`, `from`, `to`, `left`, `right`, `up`, `down`, `shelf`, `package`, `charger`, `goTo`, `turn`, `pickup`, `drop`, `load`, `unload`, `scan`, `charge`
- All coordinates are 0-indexed: valid range is `[0, width-1]` x `[0, height-1]`
- The simulation uses manhattan (horizontal-first) pathfinding — obstacle placement matters for simulation-error fixtures

---

## Chochi Language Specification

### Program Structure

A Chochi program is a flat sequence of sections. Sections can appear in any order. Singleton sections (`warehouse`, `robot`) appear at most once. List sections (`objects`, `obstacles`, `waypoints`, `tasks`) also appear at most once each.

Required sections: `warehouse`, `robot`, `tasks` (with at least one task containing at least one step).

### Grammar

```
Program     = (warehouse | robot | objects | obstacles | waypoints | tasks)*
warehouse   = "warehouse" ":" "size" "(" INT "," INT ")"
robot       = "robot" ":" "start" "at" "(" INT "," INT ")" "facing" Direction
objects     = "objects" ":" WarehouseObject*
obstacles   = "obstacles" ":" Obstacle*
waypoints   = "waypoints" ":" Waypoint*
tasks       = "tasks" ":" Task+

Direction       = "left" | "right" | "up" | "down"
ObjectKind      = "shelf" | "package" | "charger"
WarehouseObject = ObjectKind ID "at" "(" INT "," INT ")"
Obstacle        = ObstacleCell | ObstacleRect
ObstacleCell    = "at" "(" INT "," INT ")"
ObstacleRect    = "from" "(" INT "," INT ")" "to" "(" INT "," INT ")"
Waypoint        = ID "at" "(" INT "," INT ")"
Task            = ID ":" Step+
Step            = GoTo | Turn | Pickup | Drop | Load | Unload | Scan | Charge

GoTo    = "goTo" "(" ( ID | INT "," INT ) ")"
Turn    = "turn" "(" Direction ")"
Pickup  = "pickup" "(" ID ")"
Drop    = "drop" "(" ")"
Load    = "load" "(" ID ")"
Unload  = "unload" "(" ID ")"
Scan    = "scan" "(" ID ")"
Charge  = "charge" "(" ")"

ID  = /[_a-zA-Z][\w_]*/
INT = /-?[0-9]+/
Comments: // single-line   /* multi-line */
```

### Validation Rules (LSP errors — Monaco markers)

**Structural:**

- Missing `warehouse` → `Missing required section 'warehouse'.`
- Missing `robot` → `Missing required section 'robot'.`
- Missing/empty `tasks` → `Missing required section 'tasks'.`
- Warehouse width <= 0 → `Warehouse width must be positive.`
- Warehouse height <= 0 → `Warehouse height must be positive.`

**Bounds checking** (coordinates must be in `[0, width) x [0, height)`):

- Robot start out of bounds → `robot start (x, y) is outside warehouse bounds (W x H).`
- Object out of bounds → `Object 'name' at (x, y) is outside warehouse bounds.`
- Waypoint out of bounds → `Waypoint 'name' at (x, y) is outside warehouse bounds.`
- Obstacle cell out of bounds → `Obstacle at (x, y) is outside warehouse bounds.`
- Obstacle rect out of bounds → `Obstacle rectangle from (x1, y1) to (x2, y2) is outside warehouse bounds.`
- goTo coordinates out of bounds → `goTo(x, y) is outside warehouse bounds (W x H).`

**Overlap/collision:**

- Robot on obstacle → `robot start (x, y) is on an obstacle.`
- Object on obstacle → `Object 'name' overlaps an obstacle at (x, y).`
- Two objects same coordinate → `Object 'name' is at the same coordinate as 'other'.`

**Name uniqueness** (across objects, waypoints, tasks):

- Duplicate → `Duplicate name 'X'.`

**Reference resolution:**

- Unresolved reference → `Could not resolve reference to NamedTarget named 'X'.` (or similar)

**Semantic type constraints:**

- pickup on non-package → `pickup requires a package, but 'name' is a shelf/charger.`
- load on non-shelf → `load requires a shelf, but 'name' is a package/charger.`
- unload on non-shelf → `unload requires a shelf, but 'name' is a package/charger.`

### Simulation Runtime Errors (red banner, NOT Monaco markers)

These programs must have zero validation errors. The error occurs when the simulation engine processes the commands.

- goTo path crosses obstacle → `goTo path crosses obstacle at (x, y).`
- goTo path leaves bounds → `goTo path leaves warehouse bounds at (x, y).`
- Unknown goTo target → `Unknown target 'name'.`
- pickup target not a package → `pickup target is not a package.`
- Robot not at package → `Robot is not at package 'name'.`
- Already carrying → `Robot is already carrying 'name'.`
- Nothing to drop → `Robot has nothing to drop.`
- load target not a shelf → `load target is not a shelf.`
- Robot not at shelf for load → `Robot is not at shelf 'name'.`
- Not carrying anything for load → `Robot is not carrying anything to load.`
- unload target not a shelf → `unload target is not a shelf.`
- Robot not at shelf for unload → `Robot is not at shelf 'name'.`
- Already carrying for unload → `Robot is already carrying 'name'.`
- Unknown scan object → `Unknown object 'name'.`
- Not at object for scan → `Robot is not at 'name'.`
- Not at charger → `Robot is not at any charger.`

### Manhattan Pathfinding

The simulation moves horizontal-first, then vertical. From `(0, 0)` to `(3, 2)`, the path is:
`(0,0) → (1,0) → (2,0) → (3,0) → (3,1) → (3,2)`

This means an obstacle at `(2, 0)` blocks horizontal movement, but an obstacle at `(0, 1)` does NOT block this path.

````

- [ ] **Step 2: Delete CHOCHI-LANGUAGE-REFERENCE.md from root**

Run: `rm CHOCHI-LANGUAGE-REFERENCE.md`

- [ ] **Step 3: Commit**

```bash
git add e2e/GENERATE-TEST-PROGRAMS.md
git rm CHOCHI-LANGUAGE-REFERENCE.md
git commit -m "feat: add LLM generation prompt, remove root language reference"
````

---

### Task 6: Create the merge-fixtures script

**Files:**

- Create: `e2e/scripts/merge-fixtures.ts`

- [ ] **Step 1: Create e2e/scripts/ directory**

Run: `mkdir -p e2e/scripts`

- [ ] **Step 2: Create e2e/scripts/merge-fixtures.ts**

This is a utility that merges static + generated fixtures and prints the result. Useful for inspecting the full fixture set or piping to other tools.

Create `e2e/scripts/merge-fixtures.ts`:

```ts
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  name: string;
  category: 'valid' | 'parse-error' | 'simulation-error';
  description: string;
  code: string;
  expectedErrors?: string[];
  expectedError?: string;
}

const staticPath = resolve(__dirname, '../fixtures/static.json');
const generatedPath = resolve(__dirname, '../fixtures/generated.json');

const statics: Fixture[] = JSON.parse(readFileSync(staticPath, 'utf-8'));
const generated: Fixture[] = existsSync(generatedPath)
  ? JSON.parse(readFileSync(generatedPath, 'utf-8'))
  : [];

const all = [...statics, ...generated];

const byCategory = {
  valid: all.filter((f) => f.category === 'valid').length,
  'parse-error': all.filter((f) => f.category === 'parse-error').length,
  'simulation-error': all.filter((f) => f.category === 'simulation-error')
    .length,
};

console.log(`Total fixtures: ${all.length}`);
console.log(`  valid: ${byCategory.valid}`);
console.log(`  parse-error: ${byCategory['parse-error']}`);
console.log(`  simulation-error: ${byCategory['simulation-error']}`);

// Check for duplicate names
const names = new Set<string>();
for (const f of all) {
  if (names.has(f.name)) {
    console.error(`ERROR: Duplicate fixture name "${f.name}"`);
    process.exit(1);
  }
  names.add(f.name);
}

console.log('No duplicate names found.');
```

- [ ] **Step 3: Commit**

```bash
git add e2e/scripts/merge-fixtures.ts
git commit -m "feat: add merge-fixtures utility script"
```

---

### Task 7: Run the E2E tests against static fixtures

**Files:** None (verification only)

- [ ] **Step 1: Build the frontend to make sure it compiles with the data-testid changes**

Run: `npm --workspace frontend run build`
Expected: Build succeeds.

- [ ] **Step 2: Run the Playwright tests**

Run from the project root: `npx --workspace e2e playwright test`
Expected: All 15 static fixture tests run. If the dev server starts correctly and Monaco initializes, tests should pass. If there are failures, debug them.

- [ ] **Step 3: If any tests fail, debug and fix**

Common issues to check:

- If `window.monaco` is undefined: verify the `setupClassic.ts` change from Task 1 Step 6 is present
- If markers don't stabilize: increase the timeout in `waitForLspStability` from 5000 to 10000
- If the base URL is wrong: check that `vite.config.ts` has `base: '/chochi'` and the Playwright config has `baseURL: 'http://localhost:5173/chochi'`
- If WebGL/Canvas errors appear in console: these come from Three.js in headless mode. Filter them out by updating the console error assertion to ignore messages containing `WebGL` or `THREE`

If Three.js WebGL errors appear in headless mode, update the console error check in `e2e/tests/chochi-e2e.spec.ts`. Replace:

```ts
expect(
  consoleErrors,
  `Unexpected console errors for "${fixture.name}": ${JSON.stringify(consoleErrors)}`
).toHaveLength(0);
```

With:

```ts
const realErrors = consoleErrors.filter(
  (msg) => !msg.includes('WebGL') && !msg.includes('THREE')
);
expect(
  realErrors,
  `Unexpected console errors for "${fixture.name}": ${JSON.stringify(realErrors)}`
).toHaveLength(0);
```

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve E2E test issues from initial run"
```

---

### Task 8: Generate fixtures with an LLM and run full suite

**Files:**

- Create: `e2e/fixtures/generated.json` (LLM output)

- [ ] **Step 1: Generate fixtures using Claude Code CLI**

Run from the project root:

```bash
claude -p "$(cat e2e/GENERATE-TEST-PROGRAMS.md)"
```

This writes `e2e/fixtures/generated.json` directly.

- [ ] **Step 2: Validate the generated file is valid JSON with correct structure**

Run: `node -e "const f = JSON.parse(require('fs').readFileSync('e2e/fixtures/generated.json','utf-8')); console.log(f.length + ' fixtures'); f.forEach((x,i) => { if (!['valid','parse-error','simulation-error'].includes(x.category)) throw new Error('bad category at ' + i); if (!x.name || !x.code) throw new Error('missing field at ' + i); }); console.log('All valid.')"`
Expected: Prints fixture count and "All valid."

- [ ] **Step 3: Run the merge-fixtures script to check for duplicates**

Run: `npx tsx e2e/scripts/merge-fixtures.ts`
Expected: Prints totals and "No duplicate names found."

- [ ] **Step 4: Run the full Playwright suite**

Run: `npx --workspace e2e playwright test`
Expected: All static + generated fixtures pass.

- [ ] **Step 5: Fix any failing generated fixtures**

If a generated fixture fails because its expected error message doesn't match, edit `e2e/fixtures/generated.json` to fix the `expectedError`/`expectedErrors` value. The LLM may produce slightly wrong error substrings.

- [ ] **Step 6: Commit**

```bash
git add e2e/fixtures/generated.json
git commit -m "feat: add LLM-generated E2E test fixtures"
```
