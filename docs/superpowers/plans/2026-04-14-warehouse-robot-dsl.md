# Warehouse Robot DSL Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Chochi's flat command DSL with a sectioned warehouse-robot language (warehouse/robot/objects/obstacles/waypoints/tasks) and update the 3D Player to render the warehouse and simulate the new verbs with runtime validation.

**Architecture:**

- **Language** (Langium): new grammar with six sections; validator checks bounds/refs/types/collisions; generator produces a single `Scene` JSON containing environment + ordered command stream.
- **Frontend**: new `Scene`-shaped props drive static rendering (grid/obstacles/shelves/packages/chargers) plus GSAP command playback with runtime checks.
- **Data contract**: one JSON shape (`Scene`) flows from the Langium worker to the Player. Defined once in `frontend/src/types.ts`; the generator's output matches it exactly.

**Tech Stack:** Langium 3.3, TypeScript, Vitest (language tests), React + @react-three/fiber + @react-three/drei + GSAP (frontend).

---

## Spec Reference

Design spec: [`docs/superpowers/specs/2026-04-14-warehouse-robot-dsl-design.md`](../specs/2026-04-14-warehouse-robot-dsl-design.md)

---

## File Structure

### Modified / rewritten files

| File                                          | Responsibility                                                    |
| --------------------------------------------- | ----------------------------------------------------------------- | -------------------------- |
| `language/src/language/chochi.langium`        | Grammar: six top-level sections, verbs, named refs                |
| `language/src/language/chochi-validator.ts`   | Static validations (bounds, refs, types, uniqueness, collisions)  |
| `language/src/language/chochi-generator.ts`   | Build the `Scene` JSON from the AST                               |
| `language/src/language/main-browser.ts`       | Publish `Scene` (not a command array) to the frontend             |
| `language/samples/hello-world.chochi`         | New-style sample program                                          |
| `language/test/parsing/parsing.test.ts`       | Parsing tests for the new grammar                                 |
| `language/test/validating/validating.test.ts` | Validation tests                                                  |
| `language/test/linking/linking.test.ts`       | Cross-reference / linking tests (new names)                       |
| `frontend/src/types.ts`                       | `Scene`, `WarehouseCommand`, object/waypoint types                |
| `frontend/src/Editor/setupClassic.ts`         | Consume `Scene` from worker and pass upward                       |
| `frontend/src/App.tsx`                        | State holds `Scene                                                | null` and passes to Player |
| `frontend/src/Player/Player.tsx`              | Render warehouse + run commands; split into focused subcomponents |

### New files

| File                                     | Responsibility                                                                          |
| ---------------------------------------- | --------------------------------------------------------------------------------------- |
| `frontend/src/Player/Warehouse.tsx`      | Static scene: floor, grid sized to warehouse, obstacles, objects, waypoints             |
| `frontend/src/Player/sceneObjects.tsx`   | Visual sprites for shelf / package / charger / obstacle                                 |
| `frontend/src/Player/robotAnimation.ts`  | Build the GSAP timeline from `Scene.commands` with runtime checks                       |
| `frontend/src/Player/simulation.ts`      | Pure simulation engine: `simulate(scene)` returns per-step robot state + runtime errors |
| `frontend/src/Player/simulation.test.ts` | Vitest tests for the simulation engine                                                  |

---

## Shared Data Contract

This is the single source of truth for what flows from the Langium generator into the frontend. Defined in [`frontend/src/types.ts`](../../../frontend/src/types.ts); the generator must produce this exact shape.

```ts
export type Direction = 'left' | 'right' | 'up' | 'down';
export type ObjectKind = 'shelf' | 'package' | 'charger';

export interface Warehouse {
  width: number;
  height: number;
}

export interface RobotStart {
  x: number;
  y: number;
  facing: Direction;
}

export interface WarehouseObject {
  name: string;
  kind: ObjectKind;
  x: number;
  y: number;
}

export interface Waypoint {
  name: string;
  x: number;
  y: number;
}

export interface ObstacleCell {
  x: number;
  y: number;
}

export type WarehouseCommand =
  | {
      type: 'goTo';
      target:
        | { kind: 'coord'; x: number; y: number }
        | { kind: 'named'; name: string };
    }
  | { type: 'turn'; direction: Direction }
  | { type: 'pickup'; name: string }
  | { type: 'drop' }
  | { type: 'load'; name: string }
  | { type: 'unload'; name: string }
  | { type: 'scan'; name: string }
  | { type: 'charge' };

export interface Scene {
  warehouse: Warehouse;
  robot: RobotStart;
  objects: WarehouseObject[];
  obstacles: ObstacleCell[];
  waypoints: Waypoint[];
  commands: WarehouseCommand[];
}
```

---

# Phase 1 — Language: Grammar & Parsing

## Task 1: Replace grammar with new sections

**Files:**

- Modify: `language/src/language/chochi.langium`

- [ ] **Step 1: Write a failing parser test for the new grammar**

Open `language/test/parsing/parsing.test.ts` and replace its contents with:

```ts
import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model, isModel } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChochiServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  services = createChochiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chochi);
});

describe('Parsing tests', () => {
  test('parses a minimal program with required sections', async () => {
    const document = await parse(`
      warehouse:
        size(20, 15)
      robot:
        start at (0, 0) facing right
      tasks:
        go:
          goTo(5, 5)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const model = document.parseResult.value;
    expect(isModel(model)).toBe(true);
    expect(model.warehouse?.width).toBe(20);
    expect(model.warehouse?.height).toBe(15);
    expect(model.robot?.x).toBe(0);
    expect(model.robot?.y).toBe(0);
    expect(model.robot?.facing).toBe('right');
    expect(model.tasks).toHaveLength(1);
    expect(model.tasks[0].name).toBe('go');
    expect(model.tasks[0].steps).toHaveLength(1);
  });

  test('parses all object kinds', async () => {
    const document = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        shelf shelfA at (5, 5)
        package pkg1 at (1, 2)
        charger c1 at (9, 9)
      tasks:
        t:
          goTo(shelfA)
    `);
    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.objects).toHaveLength(3);
  });

  test('parses obstacles (single + rectangular)', async () => {
    const document = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      obstacles:
        at (3, 3)
        from (5, 0) to (5, 4)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.obstacles).toHaveLength(2);
  });

  test('parses waypoints and all verbs', async () => {
    const document = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        shelf s at (1, 1)
        package p at (2, 2)
        charger c at (3, 3)
      waypoints:
        home at (0, 0)
      tasks:
        t:
          goTo(home)
          goTo(7, 7)
          turn(left)
          pickup(p)
          drop()
          load(s)
          unload(s)
          scan(p)
          charge()
    `);
    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.tasks[0].steps).toHaveLength(9);
  });

  test('multiple tasks execute in declaration order', async () => {
    const document = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      tasks:
        first:
          goTo(1, 1)
        second:
          goTo(2, 2)
    `);
    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.tasks).map((t) => t.name).toEqual;
    const tasks = document.parseResult.value.tasks;
    expect(tasks.map((t) => t.name)).toEqual(['first', 'second']);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npm --workspace language test -- parsing.test.ts`
Expected: tests fail (grammar does not yet match this shape).

- [ ] **Step 3: Rewrite the grammar**

Replace the entire contents of `language/src/language/chochi.langium` with:

```langium
grammar Chochi

entry Model:
    (warehouse=Warehouse
    | robot=Robot
    | objects+=WarehouseObject
    | obstacles+=Obstacle
    | waypoints+=Waypoint
    | tasks+=Task)*;

Warehouse:
    'warehouse' ':' 'size' '(' width=INT ',' height=INT ')';

Robot:
    'robot' ':' 'start' 'at' '(' x=INT ',' y=INT ')' 'facing' facing=Direction;

Direction returns string:
    'left' | 'right' | 'up' | 'down';

WarehouseObject:
    kind=ObjectKind name=ID 'at' '(' x=INT ',' y=INT ')';

ObjectKind returns string:
    'shelf' | 'package' | 'charger';

Obstacle:
    ObstacleCell | ObstacleRect;

ObstacleCell:
    {infer ObstacleCell} 'at' '(' x=INT ',' y=INT ')';

ObstacleRect:
    {infer ObstacleRect} 'from' '(' x1=INT ',' y1=INT ')' 'to' '(' x2=INT ',' y2=INT ')';

Waypoint:
    name=ID 'at' '(' x=INT ',' y=INT ')';

Task:
    name=ID ':' steps+=Step+;

Step:
    GoTo | Turn | Pickup | Drop | Load | Unload | Scan | Charge;

GoTo:
    'goTo' '(' (targetRef=[NamedTarget:ID] | x=INT ',' y=INT) ')';

NamedTarget:
    WarehouseObject | Waypoint;

Turn:
    'turn' '(' direction=Direction ')';

Pickup:
    'pickup' '(' targetRef=[WarehouseObject:ID] ')';

Drop:
    {infer Drop} 'drop' '(' ')';

Load:
    'load' '(' targetRef=[WarehouseObject:ID] ')';

Unload:
    'unload' '(' targetRef=[WarehouseObject:ID] ')';

Scan:
    'scan' '(' targetRef=[WarehouseObject:ID] ')';

Charge:
    {infer Charge} 'charge' '(' ')';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /-?[0-9]+/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
```

Key points:

- Sections may appear in any order; Langium builds a single `Model` with optional props.
- `NamedTarget` is a grammar union used only to let `goTo` reference either an object or a waypoint. Langium generates a cross-reference over that set.
- `Pickup`/`Load`/`Unload`/`Scan` reference `WarehouseObject` directly; type-correctness (package vs shelf) is enforced in the validator, not the grammar.
- `ObstacleCell` uses `{infer ObstacleCell}` so it becomes its own type even though it shares the `at (x, y)` shape with `Waypoint`. Without the infer action, the parser would merge them. We also inline it and `ObstacleRect` as the two alternatives of `Obstacle` — callers use `isObstacleCell` / `isObstacleRect` to branch.

- [ ] **Step 4: Regenerate AST**

Run: `npm --workspace language run langium:generate`
Expected: writes `language/src/language/generated/ast.ts` and `grammar.ts` without errors.

- [ ] **Step 5: Run parsing tests — expect pass**

Run: `npm --workspace language test -- parsing.test.ts`
Expected: all 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add language/src/language/chochi.langium language/src/language/generated language/test/parsing/parsing.test.ts
git commit -m "feat(language): new grammar with warehouse/robot/objects/obstacles/waypoints/tasks sections"
```

---

# Phase 2 — Language: Validator

The validator handles every **static** check listed in the spec.

## Task 2: Rewrite validator and register checks

**Files:**

- Modify: `language/src/language/chochi-validator.ts`
- Modify: `language/src/language/chochi-module.ts` (only if registration changes)

- [ ] **Step 1: Write failing validation tests**

Replace the contents of `language/test/validating/validating.test.ts` with:

```ts
import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChochiServices>;
let parse: (input: string) => Promise<{
  diagnostics?: import('vscode-languageserver-types').Diagnostic[];
  parseResult: any;
}>;

beforeAll(async () => {
  services = createChochiServices(EmptyFileSystem);
  const doParse = parseHelper<Model>(services.Chochi);
  parse = (input: string) => doParse(input, { validation: true });
});

const errors = (doc: any) =>
  (doc.diagnostics ?? []).filter((d: any) => d.severity === 1);

describe('Validating', () => {
  test('valid program has no errors', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (3, 3)
      tasks:
        t:
          goTo(p)
          pickup(p)
    `);
    expect(doc.parseResult.parserErrors).toHaveLength(0);
    expect(errors(doc)).toHaveLength(0);
  });

  test('reports missing required sections', async () => {
    const doc = await parse(`tasks:
  t:
    goTo(0, 0)
`);
    const msgs = errors(doc).map((d: any) => d.message);
    expect(msgs.some((m) => m.includes('warehouse'))).toBe(true);
    expect(msgs.some((m) => m.includes('robot'))).toBe(true);
  });

  test('reports objects outside warehouse bounds', async () => {
    const doc = await parse(`
      warehouse:
        size(5, 5)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (10, 10)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('outside warehouse'))
    ).toBe(true);
  });

  test('reports robot start on an obstacle', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (2, 2) facing right
      obstacles:
        at (2, 2)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some(
        (d: any) =>
          d.message.includes('robot') && d.message.includes('obstacle')
      )
    ).toBe(true);
  });

  test('reports duplicate names across objects and waypoints', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package home at (1, 1)
      waypoints:
        home at (2, 2)
      tasks:
        t:
          goTo(home)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('Duplicate'))).toBe(
      true
    );
  });

  test('reports pickup on a non-package', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        shelf s at (1, 1)
      tasks:
        t:
          pickup(s)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('package'))).toBe(
      true
    );
  });

  test('reports load on a non-shelf', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (1, 1)
      tasks:
        t:
          load(p)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('shelf'))).toBe(
      true
    );
  });

  test('reports overlapping obstacle and object', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (3, 3)
      obstacles:
        at (3, 3)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('overlap'))).toBe(
      true
    );
  });

  test('reports two objects at the same coordinate', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p1 at (3, 3)
        package p2 at (3, 3)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('same coordinate'))
    ).toBe(true);
  });

  test('reports goTo(x, y) outside warehouse', async () => {
    const doc = await parse(`
      warehouse:
        size(5, 5)
      robot:
        start at (0, 0) facing right
      tasks:
        t:
          goTo(10, 10)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('outside warehouse'))
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run validation tests — expect failure**

Run: `npm --workspace language test -- validating.test.ts`
Expected: all new tests fail because the validator still references old AST types.

- [ ] **Step 3: Rewrite the validator**

Replace the contents of `language/src/language/chochi-validator.ts` with:

```ts
import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type {
  ChochiAstType,
  Model,
  WarehouseObject,
  Waypoint,
  Task,
  GoTo,
  Pickup,
  Load,
  Unload,
} from './generated/ast.js';
import {
  isObstacleCell,
  isObstacleRect,
  isWarehouseObject,
  isWaypoint,
} from './generated/ast.js';
import type { ChochiServices } from './chochi-module.js';

export function registerValidationChecks(services: ChochiServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ChochiValidator;
  const checks: ValidationChecks<ChochiAstType> = {
    Model: validator.checkModel,
    GoTo: validator.checkGoTo,
    Pickup: validator.checkPickupIsPackage,
    Load: validator.checkLoadIsShelf,
    Unload: validator.checkUnloadIsShelf,
  };
  registry.register(checks, validator);
}

export class ChochiValidator {
  checkModel = (model: Model, accept: ValidationAcceptor): void => {
    // Required sections
    if (!model.warehouse) {
      accept('error', "Missing required section 'warehouse'.", { node: model });
      return; // other checks depend on warehouse
    }
    if (!model.robot) {
      accept('error', "Missing required section 'robot'.", { node: model });
    }
    if (!model.tasks || model.tasks.length === 0) {
      accept('error', "Missing required section 'tasks'.", { node: model });
    }

    const { width, height } = model.warehouse;
    if (width <= 0) {
      accept('error', 'Warehouse width must be positive.', {
        node: model.warehouse,
        property: 'width',
      });
    }
    if (height <= 0) {
      accept('error', 'Warehouse height must be positive.', {
        node: model.warehouse,
        property: 'height',
      });
    }

    const inBounds = (x: number, y: number) =>
      x >= 0 && x < width && y >= 0 && y < height;

    // Robot start bounds + not on obstacle
    const obstacleCells = expandObstacles(model);
    if (model.robot) {
      const { x, y } = model.robot;
      if (!inBounds(x, y)) {
        accept(
          'error',
          `Robot start (${x}, ${y}) is outside warehouse bounds (${width} x ${height}).`,
          { node: model.robot, property: 'x' }
        );
      }
      if (obstacleCells.has(cellKey(x, y))) {
        accept('error', `Robot start (${x}, ${y}) is on an obstacle.`, {
          node: model.robot,
        });
      }
    }

    // Objects: bounds + no overlap with obstacles + unique coordinates
    const objectCoords = new Map<string, WarehouseObject>();
    for (const obj of model.objects ?? []) {
      if (!inBounds(obj.x, obj.y)) {
        accept(
          'error',
          `Object '${obj.name}' at (${obj.x}, ${obj.y}) is outside warehouse bounds.`,
          { node: obj }
        );
      }
      if (obstacleCells.has(cellKey(obj.x, obj.y))) {
        accept(
          'error',
          `Object '${obj.name}' overlaps an obstacle at (${obj.x}, ${obj.y}).`,
          { node: obj }
        );
      }
      const key = cellKey(obj.x, obj.y);
      const existing = objectCoords.get(key);
      if (existing) {
        accept(
          'error',
          `Object '${obj.name}' is at the same coordinate as '${existing.name}'.`,
          { node: obj }
        );
      } else {
        objectCoords.set(key, obj);
      }
    }

    // Waypoints: bounds
    for (const wp of model.waypoints ?? []) {
      if (!inBounds(wp.x, wp.y)) {
        accept(
          'error',
          `Waypoint '${wp.name}' at (${wp.x}, ${wp.y}) is outside warehouse bounds.`,
          { node: wp }
        );
      }
    }

    // Obstacle cells: bounds (both endpoints of rectangles)
    for (const o of model.obstacles ?? []) {
      if (isObstacleCell(o)) {
        if (!inBounds(o.x, o.y)) {
          accept(
            'error',
            `Obstacle at (${o.x}, ${o.y}) is outside warehouse bounds.`,
            { node: o }
          );
        }
      } else if (isObstacleRect(o)) {
        if (!inBounds(o.x1, o.y1) || !inBounds(o.x2, o.y2)) {
          accept(
            'error',
            `Obstacle rectangle from (${o.x1}, ${o.y1}) to (${o.x2}, ${o.y2}) is outside warehouse bounds.`,
            { node: o }
          );
        }
      }
    }

    // Name uniqueness across objects + waypoints + tasks
    const nameOwners = new Map<string, WarehouseObject | Waypoint | Task>();
    const reportDuplicate = (
      name: string,
      node: WarehouseObject | Waypoint | Task
    ) => {
      if (nameOwners.has(name)) {
        accept('error', `Duplicate name '${name}'.`, {
          node,
          property: 'name',
        });
      } else {
        nameOwners.set(name, node);
      }
    };
    for (const obj of model.objects ?? []) reportDuplicate(obj.name, obj);
    for (const wp of model.waypoints ?? []) reportDuplicate(wp.name, wp);
    for (const task of model.tasks ?? []) reportDuplicate(task.name, task);
  };

  checkGoTo = (goTo: GoTo, accept: ValidationAcceptor): void => {
    const model = rootModel(goTo);
    if (!model?.warehouse) return;
    // Only check raw-coordinate form; named refs are validated by Langium's linker.
    if (goTo.targetRef) return;
    const { width, height } = model.warehouse;
    if (
      goTo.x === undefined ||
      goTo.y === undefined ||
      goTo.x < 0 ||
      goTo.x >= width ||
      goTo.y < 0 ||
      goTo.y >= height
    ) {
      accept(
        'error',
        `goTo(${goTo.x}, ${goTo.y}) is outside warehouse bounds (${width} x ${height}).`,
        { node: goTo }
      );
    }
  };

  checkPickupIsPackage = (p: Pickup, accept: ValidationAcceptor): void => {
    const target = p.targetRef?.ref;
    if (target && isWarehouseObject(target) && target.kind !== 'package') {
      accept(
        'error',
        `pickup requires a package, but '${target.name}' is a ${target.kind}.`,
        { node: p, property: 'targetRef' }
      );
    }
  };

  checkLoadIsShelf = (l: Load, accept: ValidationAcceptor): void => {
    const target = l.targetRef?.ref;
    if (target && isWarehouseObject(target) && target.kind !== 'shelf') {
      accept(
        'error',
        `load requires a shelf, but '${target.name}' is a ${target.kind}.`,
        { node: l, property: 'targetRef' }
      );
    }
  };

  checkUnloadIsShelf = (u: Unload, accept: ValidationAcceptor): void => {
    const target = u.targetRef?.ref;
    if (target && isWarehouseObject(target) && target.kind !== 'shelf') {
      accept(
        'error',
        `unload requires a shelf, but '${target.name}' is a ${target.kind}.`,
        { node: u, property: 'targetRef' }
      );
    }
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const cellKey = (x: number, y: number) => `${x},${y}`;

function expandObstacles(model: Model): Set<string> {
  const cells = new Set<string>();
  for (const o of model.obstacles ?? []) {
    if (isObstacleCell(o)) {
      cells.add(cellKey(o.x, o.y));
    } else if (isObstacleRect(o)) {
      const xMin = Math.min(o.x1, o.x2);
      const xMax = Math.max(o.x1, o.x2);
      const yMin = Math.min(o.y1, o.y2);
      const yMax = Math.max(o.y1, o.y2);
      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) cells.add(cellKey(x, y));
      }
    }
  }
  return cells;
}

function rootModel(node: unknown): Model | undefined {
  let n: any = node;
  while (n && n.$container) n = n.$container;
  return n?.$type === 'Model' ? (n as Model) : undefined;
}
```

Note on Langium APIs: the existing validator already uses `ValidationAcceptor`. `isObstacleCell`, `isObstacleRect`, and `isWarehouseObject` are generated guards — if the generator produces them under different names (e.g. `isObstacle_ObstacleCell`), adjust imports accordingly by inspecting `language/src/language/generated/ast.ts` after regeneration.

- [ ] **Step 4: Run validation tests — expect pass**

Run: `npm --workspace language test -- validating.test.ts`
Expected: all 10 tests pass.

- [ ] **Step 5: Run every language test**

Run: `npm --workspace language test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add language/src/language/chochi-validator.ts language/test/validating/validating.test.ts
git commit -m "feat(language): static validations for warehouse DSL"
```

---

# Phase 3 — Language: Generator & Worker Wiring

## Task 3: Generator produces `Scene` JSON

**Files:**

- Modify: `language/src/language/chochi-generator.ts`

- [ ] **Step 1: Add a test harness for the generator**

Create `language/test/generator/generator.test.ts` with:

```ts
import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model } from '../../src/language/generated/ast.js';
import { generateScene } from '../../src/language/chochi-generator.js';

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  const services = createChochiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chochi);
});

describe('generateScene', () => {
  test('builds scene with warehouse, robot, objects, and flattened commands', async () => {
    const doc = await parse(`
      warehouse:
        size(20, 15)
      robot:
        start at (1, 2) facing right
      objects:
        shelf shelfA at (5, 5)
        package p at (3, 3)
      obstacles:
        at (4, 4)
        from (8, 0) to (8, 2)
      waypoints:
        home at (0, 0)
      tasks:
        deliver:
          goTo(p)
          pickup(p)
          goTo(shelfA)
          load(shelfA)
        goHome:
          goTo(home)
    `);
    const scene = generateScene(doc.parseResult.value);

    expect(scene.warehouse).toEqual({ width: 20, height: 15 });
    expect(scene.robot).toEqual({ x: 1, y: 2, facing: 'right' });
    expect(scene.objects).toHaveLength(2);
    expect(scene.waypoints).toEqual([{ name: 'home', x: 0, y: 0 }]);

    // Obstacle rectangle (8,0)->(8,2) expands to three cells
    expect(scene.obstacles).toEqual(
      expect.arrayContaining([
        { x: 4, y: 4 },
        { x: 8, y: 0 },
        { x: 8, y: 1 },
        { x: 8, y: 2 },
      ])
    );
    expect(scene.obstacles).toHaveLength(4);

    // Tasks flatten in declaration order
    expect(scene.commands).toEqual([
      { type: 'goTo', target: { kind: 'named', name: 'p' } },
      { type: 'pickup', name: 'p' },
      { type: 'goTo', target: { kind: 'named', name: 'shelfA' } },
      { type: 'load', name: 'shelfA' },
      { type: 'goTo', target: { kind: 'named', name: 'home' } },
    ]);
  });

  test('goTo(x, y) becomes a coord target', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      tasks:
        t:
          goTo(4, 5)
    `);
    const scene = generateScene(doc.parseResult.value);
    expect(scene.commands).toEqual([
      { type: 'goTo', target: { kind: 'coord', x: 4, y: 5 } },
    ]);
  });

  test('serializes drop/charge/turn/scan/unload', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        shelf s at (1, 1)
        package p at (2, 2)
        charger c at (3, 3)
      tasks:
        t:
          turn(left)
          drop()
          scan(p)
          unload(s)
          charge()
    `);
    const scene = generateScene(doc.parseResult.value);
    expect(scene.commands).toEqual([
      { type: 'turn', direction: 'left' },
      { type: 'drop' },
      { type: 'scan', name: 'p' },
      { type: 'unload', name: 's' },
      { type: 'charge' },
    ]);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npm --workspace language test -- generator.test.ts`
Expected: fails — `generateScene` is not exported.

- [ ] **Step 3: Rewrite the generator**

Replace the contents of `language/src/language/chochi-generator.ts` with:

```ts
import {
  Model,
  isGoTo,
  isTurn,
  isPickup,
  isDrop,
  isLoad,
  isUnload,
  isScan,
  isCharge,
  isObstacleCell,
  isObstacleRect,
} from './generated/ast.js';

export interface Scene {
  warehouse: { width: number; height: number };
  robot: { x: number; y: number; facing: 'left' | 'right' | 'up' | 'down' };
  objects: {
    name: string;
    kind: 'shelf' | 'package' | 'charger';
    x: number;
    y: number;
  }[];
  obstacles: { x: number; y: number }[];
  waypoints: { name: string; x: number; y: number }[];
  commands: Command[];
}

export type Command =
  | {
      type: 'goTo';
      target:
        | { kind: 'coord'; x: number; y: number }
        | { kind: 'named'; name: string };
    }
  | { type: 'turn'; direction: 'left' | 'right' | 'up' | 'down' }
  | { type: 'pickup'; name: string }
  | { type: 'drop' }
  | { type: 'load'; name: string }
  | { type: 'unload'; name: string }
  | { type: 'scan'; name: string }
  | { type: 'charge' };

export const generateScene = (model: Model): Scene => {
  const scene: Scene = {
    warehouse: {
      width: model.warehouse?.width ?? 0,
      height: model.warehouse?.height ?? 0,
    },
    robot: {
      x: model.robot?.x ?? 0,
      y: model.robot?.y ?? 0,
      facing: (model.robot?.facing as Scene['robot']['facing']) ?? 'right',
    },
    objects: (model.objects ?? []).map((o) => ({
      name: o.name,
      kind: o.kind as Scene['objects'][number]['kind'],
      x: o.x,
      y: o.y,
    })),
    obstacles: expandObstacles(model),
    waypoints: (model.waypoints ?? []).map((w) => ({
      name: w.name,
      x: w.x,
      y: w.y,
    })),
    commands: (model.tasks ?? []).flatMap((task) =>
      task.steps.map(stepToCommand)
    ),
  };
  return scene;
};

const stepToCommand = (step: any): Command => {
  if (isGoTo(step)) {
    if (step.targetRef) {
      return {
        type: 'goTo',
        target: { kind: 'named', name: step.targetRef.$refText },
      };
    }
    return { type: 'goTo', target: { kind: 'coord', x: step.x, y: step.y } };
  }
  if (isTurn(step)) {
    return { type: 'turn', direction: step.direction };
  }
  if (isPickup(step)) {
    return { type: 'pickup', name: step.targetRef.$refText };
  }
  if (isDrop(step)) {
    return { type: 'drop' };
  }
  if (isLoad(step)) {
    return { type: 'load', name: step.targetRef.$refText };
  }
  if (isUnload(step)) {
    return { type: 'unload', name: step.targetRef.$refText };
  }
  if (isScan(step)) {
    return { type: 'scan', name: step.targetRef.$refText };
  }
  if (isCharge(step)) {
    return { type: 'charge' };
  }
  throw new Error(`Unknown step: ${(step as any)?.$type}`);
};

const expandObstacles = (model: Model): Scene['obstacles'] => {
  const out: Scene['obstacles'] = [];
  for (const o of model.obstacles ?? []) {
    if (isObstacleCell(o)) {
      out.push({ x: o.x, y: o.y });
    } else if (isObstacleRect(o)) {
      const xMin = Math.min(o.x1, o.x2);
      const xMax = Math.max(o.x1, o.x2);
      const yMin = Math.min(o.y1, o.y2);
      const yMax = Math.max(o.y1, o.y2);
      for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) out.push({ x, y });
      }
    }
  }
  return out;
};
```

Using `$refText` is deliberate: at generation time, the named reference may still be resolving, but the text is always stable. The frontend looks up by name against its own object/waypoint list.

- [ ] **Step 4: Run the generator test — expect pass**

Run: `npm --workspace language test -- generator.test.ts`
Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add language/src/language/chochi-generator.ts language/test/generator/generator.test.ts
git commit -m "feat(language): generate Scene JSON from AST"
```

## Task 4: Update worker to publish `Scene`

**Files:**

- Modify: `language/src/language/main-browser.ts`

- [ ] **Step 1: Update the worker**

Open `language/src/language/main-browser.ts` and replace the `generateChochiCommands` import + the property it injects:

```ts
// change import
import { generateScene } from './chochi-generator.js';

// in the onBuildPhase callback, replace the $commands assignment with:
(module as unknown as { $scene: ReturnType<typeof generateScene> }).$scene =
  generateScene(module);
```

Keep everything else identical. The notification shape is unchanged (the scene is embedded via `jsonSerializer.serialize(module, ...)`).

- [ ] **Step 2: Build the worker**

Run: `npm run generate:worker`
Expected: completes without errors, writes `frontend/public/chochiWorker.js`.

- [ ] **Step 3: Commit**

```bash
git add language/src/language/main-browser.ts frontend/public/chochiWorker.js
git commit -m "feat(language): publish Scene from worker instead of flat commands"
```

## Task 5: Replace sample program

**Files:**

- Modify: `language/samples/hello-world.chochi`

- [ ] **Step 1: Write a new sample**

Replace the contents of `language/samples/hello-world.chochi` with:

```
warehouse:
  size(20, 15)

robot:
  start at (0, 0) facing right

objects:
  shelf shelfA at (10, 2)
  package package1 at (3, 4)
  charger charger1 at (0, 14)

obstacles:
  from (8, 0) to (8, 4)

waypoints:
  home at (0, 0)

tasks:
  deliverPackage1:
    goTo(package1)
    pickup(package1)
    goTo(shelfA)
    load(shelfA)

  returnHome:
    goTo(home)
    charge()
```

- [ ] **Step 2: Commit**

```bash
git add language/samples/hello-world.chochi
git commit -m "chore(language): update sample to warehouse DSL"
```

---

# Phase 4 — Frontend: Shared Types & Wiring

## Task 6: Define the new shared types

**Files:**

- Modify: `frontend/src/types.ts`

- [ ] **Step 1: Replace `types.ts` with the `Scene` contract**

Replace the full contents of `frontend/src/types.ts` with the data contract from this plan's "Shared Data Contract" section (the block beginning `export type Direction = ...`). Nothing else goes in this file.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/types.ts
git commit -m "feat(frontend): new Scene type for warehouse DSL"
```

## Task 7: Editor setup passes `Scene` upward

**Files:**

- Modify: `frontend/src/Editor/setupClassic.ts`
- Modify: `frontend/src/Editor/Editor.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Read current `setupClassic.ts`**

Open `frontend/src/Editor/setupClassic.ts` to see how commands are extracted. The callback type and notification-parsing are the pieces that change.

- [ ] **Step 2: Change the callback signature to `Scene`**

In `setupClassic.ts`, update the `onCommands` parameter (and any function signature using it) from `(commands: ICommand[]) => void` to `(scene: Scene | null) => void`. When parsing the worker's DocumentChange notification, after getting the module JSON, read `module.$scene` and pass it to the callback. If validation failed or `$scene` is missing, pass `null`.

Example adjustment (exact integration depends on what `setupClassic.ts` looks like — match the existing notification handler):

```ts
import { Scene } from '../types';

// previous: onCommands: (commands: ICommand[]) => void
// new:      onScene: (scene: Scene | null) => void

// inside the notification handler after JSON.parse(...)
const scene = (parsed.$scene as Scene | undefined) ?? null;
onScene(scene);
```

Rename the parameter throughout (`onCommands` → `onScene`) in `setupClassic.ts` and anywhere it's wired.

- [ ] **Step 3: Update `Editor.tsx`**

Modify [`frontend/src/Editor/Editor.tsx`](../../../frontend/src/Editor/Editor.tsx):

```tsx
import { Scene } from '../types';
// ...
interface EditorProps {
  onScene?: (scene: Scene | null) => void;
  theme?: Theme;
}

export const Editor = ({ onScene = () => {}, theme = 'dark' }: EditorProps) => {
  // ...
  const editor = await executeClassic(containerRef.current!, onScene);
  // ...
};
```

- [ ] **Step 4: Update `App.tsx`**

Change `App.tsx`:

```tsx
import { Scene } from './types';

const [scene, setScene] = useState<Scene | null>(null);
// ...
<Editor onScene={setScene} theme={theme} />
// ...
<Player scene={scene} timelineRef={timelineRef} onComplete={handleComplete} />
```

Remove the `ICommand` import; it no longer exists.

- [ ] **Step 5: Type-check the frontend**

Run: `npm --workspace frontend run build`
Expected: fails inside `Player.tsx` (uses old `ICommand`) — that's Phase 5's job. No other type errors.

- [ ] **Step 6: Commit (expect known Player breakage)**

```bash
git add frontend/src/Editor frontend/src/App.tsx
git commit -m "feat(frontend): plumb Scene from worker into App state"
```

---

# Phase 5 — Frontend: Simulation Engine (pure, testable)

## Task 8: Pure simulation module

**Files:**

- Create: `frontend/src/Player/simulation.ts`
- Create: `frontend/src/Player/simulation.test.ts`

The simulation engine is **pure** — it takes a `Scene` and returns a list of per-step robot states plus any runtime errors. The animation layer consumes this deterministic trace.

- [ ] **Step 1: Write failing simulation tests**

Create `frontend/src/Player/simulation.test.ts`:

```ts
import { describe, expect, test } from 'vitest';
import { simulate } from './simulation';
import { Scene } from '../types';

const baseScene = (overrides: Partial<Scene>): Scene => ({
  warehouse: { width: 10, height: 10 },
  robot: { x: 0, y: 0, facing: 'right' },
  objects: [],
  obstacles: [],
  waypoints: [],
  commands: [],
  ...overrides,
});

describe('simulate', () => {
  test('goTo(x, y) moves robot', () => {
    const result = simulate(
      baseScene({
        commands: [{ type: 'goTo', target: { kind: 'coord', x: 3, y: 0 } }],
      })
    );
    expect(result.error).toBeUndefined();
    const final = result.steps.at(-1)!;
    expect(final.robot.x).toBe(3);
    expect(final.robot.y).toBe(0);
  });

  test('goTo(named) resolves to object position', () => {
    const result = simulate(
      baseScene({
        objects: [{ name: 'p', kind: 'package', x: 2, y: 2 }],
        commands: [{ type: 'goTo', target: { kind: 'named', name: 'p' } }],
      })
    );
    expect(result.error).toBeUndefined();
    expect(result.steps.at(-1)!.robot.x).toBe(2);
    expect(result.steps.at(-1)!.robot.y).toBe(2);
  });

  test('goTo crosses obstacle → runtime error', () => {
    const result = simulate(
      baseScene({
        obstacles: [{ x: 2, y: 0 }],
        commands: [{ type: 'goTo', target: { kind: 'coord', x: 5, y: 0 } }],
      })
    );
    expect(result.error).toBeDefined();
    expect(result.error!.message).toMatch(/obstacle/i);
    expect(result.error!.commandIndex).toBe(0);
  });

  test('pickup when not at package → runtime error', () => {
    const result = simulate(
      baseScene({
        objects: [{ name: 'p', kind: 'package', x: 5, y: 5 }],
        commands: [{ type: 'pickup', name: 'p' }],
      })
    );
    expect(result.error!.message).toMatch(/not at/i);
  });

  test('pickup while carrying → runtime error', () => {
    const result = simulate(
      baseScene({
        objects: [
          { name: 'a', kind: 'package', x: 0, y: 0 },
          { name: 'b', kind: 'package', x: 1, y: 0 },
        ],
        commands: [
          { type: 'pickup', name: 'a' },
          { type: 'goTo', target: { kind: 'named', name: 'b' } },
          { type: 'pickup', name: 'b' },
        ],
      })
    );
    expect(result.error!.message).toMatch(/already carrying/i);
    expect(result.error!.commandIndex).toBe(2);
  });

  test('drop with nothing carried → runtime error', () => {
    const result = simulate(baseScene({ commands: [{ type: 'drop' }] }));
    expect(result.error!.message).toMatch(/nothing/i);
  });

  test('load requires being at shelf and carrying', () => {
    const result = simulate(
      baseScene({
        objects: [
          { name: 'p', kind: 'package', x: 0, y: 0 },
          { name: 's', kind: 'shelf', x: 3, y: 0 },
        ],
        commands: [
          { type: 'pickup', name: 'p' },
          { type: 'load', name: 's' },
        ],
      })
    );
    expect(result.error!.message).toMatch(/not at/i);
  });

  test('charge away from charger → error', () => {
    const result = simulate(
      baseScene({
        objects: [{ name: 'c', kind: 'charger', x: 5, y: 5 }],
        commands: [{ type: 'charge' }],
      })
    );
    expect(result.error!.message).toMatch(/charger/i);
  });

  test('turn(left) flips facing from right to up', () => {
    const result = simulate(
      baseScene({ commands: [{ type: 'turn', direction: 'left' }] })
    );
    expect(result.steps.at(-1)!.robot.facing).toBe('up');
  });

  test('goTo uses horizontal-then-vertical path', () => {
    const result = simulate(
      baseScene({
        commands: [{ type: 'goTo', target: { kind: 'coord', x: 2, y: 3 } }],
      })
    );
    // Path cells: (0,0) -> (1,0) -> (2,0) -> (2,1) -> (2,2) -> (2,3)
    const path = result.steps.at(-1)!.path;
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
    ]);
  });
});
```

- [ ] **Step 2: Run the test — expect failure**

Run: `npm --workspace frontend test -- simulation.test.ts`
Expected: fails — `simulation.ts` doesn't exist yet.

- [ ] **Step 3: Implement the simulation engine**

Create `frontend/src/Player/simulation.ts`:

```ts
import { Direction, Scene, WarehouseCommand, WarehouseObject } from '../types';

export interface RobotState {
  x: number;
  y: number;
  facing: Direction;
  carrying: string | null;
  /** Cells traversed by the command that produced this step (used by the animator). */
  path: { x: number; y: number }[];
}

export interface SimulationStep {
  command: WarehouseCommand;
  commandIndex: number;
  robot: RobotState;
}

export interface SimulationError {
  commandIndex: number;
  message: string;
}

export interface SimulationResult {
  steps: SimulationStep[];
  error?: SimulationError;
}

export const simulate = (scene: Scene): SimulationResult => {
  const byName = indexByName(scene);
  const obstacleSet = new Set(scene.obstacles.map((o) => `${o.x},${o.y}`));
  const { width, height } = scene.warehouse;

  let robot: RobotState = {
    x: scene.robot.x,
    y: scene.robot.y,
    facing: scene.robot.facing,
    carrying: null,
    path: [{ x: scene.robot.x, y: scene.robot.y }],
  };

  const steps: SimulationStep[] = [];

  const fail = (commandIndex: number, message: string): SimulationResult => ({
    steps,
    error: { commandIndex, message },
  });

  for (let i = 0; i < scene.commands.length; i++) {
    const cmd = scene.commands[i];
    switch (cmd.type) {
      case 'goTo': {
        const dest =
          cmd.target.kind === 'coord'
            ? { x: cmd.target.x, y: cmd.target.y }
            : resolvePosition(cmd.target.name, byName);
        if (!dest)
          return fail(i, `Unknown target '${(cmd.target as any).name}'.`);

        const path = manhattanPath(robot, dest);
        for (const cell of path) {
          if (cell.x < 0 || cell.x >= width || cell.y < 0 || cell.y >= height) {
            return fail(
              i,
              `goTo path leaves warehouse bounds at (${cell.x}, ${cell.y}).`
            );
          }
          if (obstacleSet.has(`${cell.x},${cell.y}`)) {
            return fail(
              i,
              `goTo path crosses obstacle at (${cell.x}, ${cell.y}).`
            );
          }
        }
        robot = { ...robot, x: dest.x, y: dest.y, path };
        break;
      }
      case 'turn': {
        robot = {
          ...robot,
          facing: turn(robot.facing, cmd.direction),
          path: [],
        };
        break;
      }
      case 'pickup': {
        const obj = byName.get(cmd.name);
        if (!obj || obj.kind !== 'package')
          return fail(i, `pickup target is not a package.`);
        if (robot.x !== obj.x || robot.y !== obj.y) {
          return fail(i, `Robot is not at package '${cmd.name}'.`);
        }
        if (robot.carrying) {
          return fail(i, `Robot is already carrying '${robot.carrying}'.`);
        }
        robot = { ...robot, carrying: cmd.name, path: [] };
        break;
      }
      case 'drop': {
        if (!robot.carrying) return fail(i, `Robot is not carrying anything.`);
        robot = { ...robot, carrying: null, path: [] };
        break;
      }
      case 'load': {
        const obj = byName.get(cmd.name);
        if (!obj || obj.kind !== 'shelf')
          return fail(i, `load target is not a shelf.`);
        if (robot.x !== obj.x || robot.y !== obj.y) {
          return fail(i, `Robot is not at shelf '${cmd.name}'.`);
        }
        if (!robot.carrying) {
          return fail(i, `Robot is not carrying anything to load.`);
        }
        robot = { ...robot, carrying: null, path: [] };
        break;
      }
      case 'unload': {
        const obj = byName.get(cmd.name);
        if (!obj || obj.kind !== 'shelf')
          return fail(i, `unload target is not a shelf.`);
        if (robot.x !== obj.x || robot.y !== obj.y) {
          return fail(i, `Robot is not at shelf '${cmd.name}'.`);
        }
        if (robot.carrying) {
          return fail(i, `Robot is already carrying '${robot.carrying}'.`);
        }
        robot = { ...robot, carrying: `from:${cmd.name}`, path: [] };
        break;
      }
      case 'scan': {
        const obj = byName.get(cmd.name);
        if (!obj) return fail(i, `Unknown object '${cmd.name}'.`);
        if (robot.x !== obj.x || robot.y !== obj.y) {
          return fail(i, `Robot is not at '${cmd.name}'.`);
        }
        robot = { ...robot, path: [] };
        break;
      }
      case 'charge': {
        const charger = [...byName.values()].find(
          (o) => o.kind === 'charger' && o.x === robot.x && o.y === robot.y
        );
        if (!charger) return fail(i, `Robot is not at any charger.`);
        robot = { ...robot, path: [] };
        break;
      }
    }
    steps.push({ command: cmd, commandIndex: i, robot });
  }

  return { steps };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const indexByName = (
  scene: Scene
): Map<
  string,
  WarehouseObject | { name: string; kind: 'waypoint'; x: number; y: number }
> => {
  const m = new Map<
    string,
    WarehouseObject | { name: string; kind: 'waypoint'; x: number; y: number }
  >();
  for (const o of scene.objects) m.set(o.name, o);
  for (const w of scene.waypoints) m.set(w.name, { ...w, kind: 'waypoint' });
  return m;
};

const resolvePosition = (
  name: string,
  byName: ReturnType<typeof indexByName>
) => {
  const entry = byName.get(name);
  return entry ? { x: entry.x, y: entry.y } : null;
};

const manhattanPath = (
  from: { x: number; y: number },
  to: { x: number; y: number }
): { x: number; y: number }[] => {
  const path: { x: number; y: number }[] = [{ x: from.x, y: from.y }];
  let { x, y } = from;
  const dx = Math.sign(to.x - x);
  while (x !== to.x) {
    x += dx;
    path.push({ x, y });
  }
  const dy = Math.sign(to.y - y);
  while (y !== to.y) {
    y += dy;
    path.push({ x, y });
  }
  return path;
};

const turn = (facing: Direction, command: Direction): Direction => {
  // Absolute when command is up/down: rotate 90° in that absolute direction.
  // Relative when command is left/right: rotate relative to current facing.
  if (command === 'up' || command === 'down') return command;
  const order: Direction[] = ['right', 'down', 'left', 'up'];
  const idx = order.indexOf(facing);
  const step = command === 'right' ? 1 : -1;
  return order[(idx + step + order.length) % order.length];
};
```

Design notes:

- `unload` records a synthetic name `from:<shelfName>` so the animator can show something being carried, without needing named items-on-shelves.
- `turn` handles both absolute (`up`/`down`) and relative (`left`/`right`) directions per the spec.
- `path` on `RobotState` is populated for `goTo` only; other commands clear it.

- [ ] **Step 4: Run the tests — expect pass**

Run: `npm --workspace frontend test -- simulation.test.ts`
Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/Player/simulation.ts frontend/src/Player/simulation.test.ts
git commit -m "feat(frontend): pure warehouse simulation engine"
```

---

# Phase 6 — Frontend: Player Rewrite

The Player's existing timeline mixes warehouse rendering, character sprite, fire particles, and command handling in one file. Split into focused components consuming the `Scene` + simulation trace.

## Task 9: Warehouse renderer (floor, grid, obstacles, objects, waypoints)

**Files:**

- Create: `frontend/src/Player/sceneObjects.tsx`
- Create: `frontend/src/Player/Warehouse.tsx`

- [ ] **Step 1: Write `sceneObjects.tsx` with sprite components**

Create `frontend/src/Player/sceneObjects.tsx`:

```tsx
import { RoundedBox, Text } from '@react-three/drei';
import { WarehouseObject, ObstacleCell, Waypoint } from '../types';

export const Shelf = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    {/* Legs */}
    {[
      [-0.35, 0.25, -0.35],
      [0.35, 0.25, -0.35],
      [-0.35, 0.25, 0.35],
      [0.35, 0.25, 0.35],
    ].map(([x, y, z], i) => (
      <mesh key={i} position={[x, y, z]} castShadow>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color="#8b6f47" />
      </mesh>
    ))}
    {/* Top surface — robot passes UNDER */}
    <RoundedBox
      args={[0.9, 0.08, 0.9]}
      position={[0, 0.6, 0]}
      radius={0.02}
      smoothness={4}
      castShadow
    >
      <meshStandardMaterial color="#a67c52" />
    </RoundedBox>
    <NameTag name={obj.name} yOffset={0.75} />
  </group>
);

export const Package = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    <RoundedBox
      args={[0.4, 0.4, 0.4]}
      position={[0, 0.2, 0]}
      radius={0.03}
      smoothness={4}
      castShadow
    >
      <meshStandardMaterial color="#c49a6c" />
    </RoundedBox>
    <NameTag name={obj.name} yOffset={0.55} />
  </group>
);

export const Charger = ({ obj }: { obj: WarehouseObject }) => (
  <group position={[obj.x, 0, obj.y]}>
    <mesh position={[0, 0.05, 0]} castShadow>
      <cylinderGeometry args={[0.35, 0.4, 0.1, 24]} />
      <meshStandardMaterial
        color="#2dd4bf"
        emissive="#0d9488"
        emissiveIntensity={0.3}
      />
    </mesh>
    <mesh position={[0, 0.2, 0]} castShadow>
      <cylinderGeometry args={[0.08, 0.08, 0.25, 12]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    <NameTag name={obj.name} yOffset={0.5} />
  </group>
);

export const Obstacle = ({ cell }: { cell: ObstacleCell }) => (
  <mesh position={[cell.x, 0.25, cell.y]} castShadow>
    <boxGeometry args={[0.95, 0.5, 0.95]} />
    <meshStandardMaterial color="#ef4444" roughness={0.8} />
  </mesh>
);

export const WaypointMarker = ({ waypoint }: { waypoint: Waypoint }) => (
  <group position={[waypoint.x, 0, waypoint.y]}>
    <mesh position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 0.42, 24]} />
      <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
    </mesh>
    <NameTag name={waypoint.name} yOffset={0.1} color="#60a5fa" />
  </group>
);

const NameTag = ({
  name,
  yOffset,
  color = '#e5e7eb',
}: {
  name: string;
  yOffset: number;
  color?: string;
}) => (
  <Text
    position={[0, yOffset, 0]}
    fontSize={0.18}
    color={color}
    anchorX="center"
    anchorY="middle"
  >
    {name}
  </Text>
);
```

- [ ] **Step 2: Write `Warehouse.tsx`**

Create `frontend/src/Player/Warehouse.tsx`:

```tsx
import { Grid } from '@react-three/drei';
import { Scene } from '../types';
import {
  Charger,
  Obstacle,
  Package,
  Shelf,
  WaypointMarker,
} from './sceneObjects';

export const Warehouse = ({ scene }: { scene: Scene }) => {
  const { width, height } = scene.warehouse;

  return (
    <>
      {/* Floor scaled to warehouse size */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[(width - 1) / 2, -0.51, (height - 1) / 2]}
        receiveShadow
      >
        <planeGeometry args={[width + 2, height + 2]} />
        <meshStandardMaterial color="#1f2333" />
      </mesh>

      {/* Grid lines sized to warehouse */}
      <Grid
        position={[(width - 1) / 2, -0.5, (height - 1) / 2]}
        args={[width, height]}
        cellSize={1}
        cellThickness={1}
        cellColor="#2a2e3d"
        sectionSize={5}
        sectionThickness={1.5}
        sectionColor="#3a3f52"
        fadeDistance={Math.max(width, height) * 3}
        fadeStrength={1}
        infiniteGrid={false}
      />

      {/* Obstacles */}
      {scene.obstacles.map((o, i) => (
        <Obstacle key={`obs-${i}`} cell={o} />
      ))}

      {/* Objects */}
      {scene.objects.map((o) => {
        if (o.kind === 'shelf') return <Shelf key={o.name} obj={o} />;
        if (o.kind === 'package') return <Package key={o.name} obj={o} />;
        return <Charger key={o.name} obj={o} />;
      })}

      {/* Waypoints */}
      {scene.waypoints.map((w) => (
        <WaypointMarker key={w.name} waypoint={w} />
      ))}
    </>
  );
};
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/Player/sceneObjects.tsx frontend/src/Player/Warehouse.tsx
git commit -m "feat(frontend): warehouse scene renderer"
```

## Task 10: Robot animation module

**Files:**

- Create: `frontend/src/Player/robotAnimation.ts`

The animator takes the simulation trace and builds a GSAP timeline. It's the one piece that still needs DOM refs (robot group), so it exposes a single function.

- [ ] **Step 1: Create `robotAnimation.ts`**

```ts
import gsap from 'gsap';
import { Group, Vector3 } from 'three';
import { Direction, Scene } from '../types';
import { SimulationResult } from './simulation';

const directionToRotation: Record<Direction, number> = {
  right: 0,
  down: Math.PI / 2,
  left: Math.PI,
  up: -Math.PI / 2,
};

interface BuildOptions {
  scene: Scene;
  simulation: SimulationResult;
  robotRef: React.RefObject<Group>;
  /** Called with the index of the currently-executing command for overlay state. */
  onCommandIndex: (index: number) => void;
  onComplete: () => void;
}

export const buildRobotTimeline = ({
  scene,
  simulation,
  robotRef,
  onCommandIndex,
  onComplete,
}: BuildOptions): gsap.core.Timeline => {
  const tl = gsap.timeline({ onComplete });

  // Snap to initial robot position
  tl.set(robotRef.current!.position, {
    x: scene.robot.x,
    y: 0,
    z: scene.robot.y,
  });
  tl.set(robotRef.current!.rotation, {
    y: directionToRotation[scene.robot.facing],
  });

  for (const step of simulation.steps) {
    tl.call(() => onCommandIndex(step.commandIndex));

    switch (step.command.type) {
      case 'goTo': {
        // Animate along the cached manhattan path, segment by segment.
        const path = step.robot.path;
        // path[0] is starting position; animate to each subsequent cell.
        for (let i = 1; i < path.length; i++) {
          const cell = path[i];
          tl.to(robotRef.current!.position, {
            x: cell.x,
            z: cell.y,
            duration: 0.25,
            ease: 'none',
          });
        }
        break;
      }
      case 'turn': {
        tl.to(robotRef.current!.rotation, {
          y: directionToRotation[step.robot.facing],
          duration: 0.35,
          ease: 'power2.inOut',
        });
        break;
      }
      case 'pickup':
      case 'unload':
        // Brief bob to indicate grasp.
        tl.to(robotRef.current!.position, {
          y: 0.1,
          duration: 0.12,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
        break;
      case 'drop':
      case 'load':
        tl.to(robotRef.current!.position, {
          y: 0.05,
          duration: 0.15,
          yoyo: true,
          repeat: 1,
          ease: 'sine.inOut',
        });
        break;
      case 'scan':
        tl.to(robotRef.current!.rotation, {
          y: `+=${Math.PI * 2}`,
          duration: 0.6,
          ease: 'power1.inOut',
        });
        break;
      case 'charge':
        tl.to({}, { duration: 0.8 });
        break;
    }
  }

  return tl;
};

// Convenience for debug / tests
export const _directionToRotation = directionToRotation;
export type { BuildOptions };
export type { Vector3 };
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/Player/robotAnimation.ts
git commit -m "feat(frontend): GSAP timeline builder for simulation trace"
```

## Task 11: Rewrite `Player.tsx` to use the new pieces

**Files:**

- Modify: `frontend/src/Player/Player.tsx`

- [ ] **Step 1: Rewrite the Player**

Replace the contents of `frontend/src/Player/Player.tsx` with:

```tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Environment,
  OrbitControls,
  RoundedBox,
  Sphere,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group, MeshStandardMaterial, Vector3 } from 'three';
import gsap from 'gsap';
import { Scene, WarehouseCommand } from '../types';
import { useTheme } from '../theme';
import { Warehouse } from './Warehouse';
import { simulate } from './simulation';
import { buildRobotTimeline } from './robotAnimation';

const formatCommand = (cmd: WarehouseCommand): string => {
  switch (cmd.type) {
    case 'goTo':
      return cmd.target.kind === 'coord'
        ? `goTo(${cmd.target.x}, ${cmd.target.y})`
        : `goTo(${cmd.target.name})`;
    case 'turn':
      return `turn(${cmd.direction})`;
    case 'pickup':
      return `pickup(${cmd.name})`;
    case 'drop':
      return 'drop()';
    case 'load':
      return `load(${cmd.name})`;
    case 'unload':
      return `unload(${cmd.name})`;
    case 'scan':
      return `scan(${cmd.name})`;
    case 'charge':
      return 'charge()';
  }
};

export const Player = ({
  scene,
  timelineRef,
  onComplete,
}: {
  scene: Scene | null;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
}) => {
  const [activeCommandIndex, setActiveCommandIndex] = useState(0);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);

  if (!scene) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        Edit a program to see the warehouse.
      </div>
    );
  }

  const activeCommand = scene.commands[activeCommandIndex];

  return (
    <div className="w-full h-full relative">
      {activeCommand && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-gray-900/75 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium uppercase tracking-wider font-mono text-gray-400">
                {activeCommandIndex + 1}/{scene.commands.length}
              </span>
              <code className="text-sm font-mono text-white">
                {formatCommand(activeCommand)}
              </code>
            </div>
          </div>
        </div>
      )}

      {runtimeError && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10">
          <div className="px-3 py-1.5 rounded-lg bg-red-900/80 border border-red-500/40">
            <code className="text-sm font-mono text-red-100">
              {runtimeError}
            </code>
          </div>
        </div>
      )}

      <Canvas
        shadows
        orthographic
        camera={{
          position: [
            scene.warehouse.width + 5,
            Math.max(scene.warehouse.width, scene.warehouse.height),
            scene.warehouse.height + 5,
          ],
          zoom: 40,
        }}
      >
        <color attach="background" args={['#1a1d2e']} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[20, 30, 20]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />

        <Warehouse scene={scene} />

        <RobotActor
          scene={scene}
          timelineRef={timelineRef}
          onComplete={onComplete}
          onCommandIndex={setActiveCommandIndex}
          onRuntimeError={setRuntimeError}
        />

        <OrbitControls
          enablePan={false}
          minZoom={20}
          maxZoom={120}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 3}
        />
        <Environment
          preset="city"
          background={false}
          environmentIntensity={0.4}
        />
      </Canvas>
    </div>
  );
};

const RobotActor = ({
  scene,
  timelineRef,
  onComplete,
  onCommandIndex,
  onRuntimeError,
}: {
  scene: Scene;
  timelineRef: React.MutableRefObject<gsap.core.Timeline | null>;
  onComplete: () => void;
  onCommandIndex: (index: number) => void;
  onRuntimeError: (msg: string | null) => void;
}) => {
  const groupRef = useRef<Group>(null!);

  useEffect(() => {
    const simulation = simulate(scene);
    onRuntimeError(simulation.error ? simulation.error.message : null);

    const tl = buildRobotTimeline({
      scene,
      simulation,
      robotRef: groupRef,
      onCommandIndex,
      onComplete,
    });
    timelineRef.current = tl;
    tl.play();

    return () => {
      tl.kill();
      timelineRef.current = null;
    };
  }, [scene, timelineRef, onComplete, onCommandIndex, onRuntimeError]);

  return (
    <group ref={groupRef}>
      <RoundedBox
        args={[0.7, 0.25, 0.7]}
        position={[0, 0.2, 0]}
        radius={0.05}
        smoothness={4}
        castShadow
      >
        <meshStandardMaterial color="#ff8c00" />
      </RoundedBox>
      <Sphere args={[0.12, 16, 16]} position={[0, 0.42, 0]}>
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </Sphere>
      {/* Facing indicator */}
      <Sphere args={[0.04, 12, 12]} position={[0, 0.2, 0.35]}>
        <meshStandardMaterial
          color="#66ccff"
          emissive="#66ccff"
          emissiveIntensity={1}
        />
      </Sphere>
    </group>
  );
};
```

The previous Player's fire-particle and character-sprite code is intentionally dropped. If you want those back later, restore `FireParticles` / `Character` from git history as focused modules — keep the new Player focused on the warehouse workflow first.

- [ ] **Step 2: Type-check the frontend**

Run: `npm --workspace frontend run build`
Expected: succeeds.

- [ ] **Step 3: Run the dev server and smoke-test the sample program**

Run: `npm --workspace frontend run dev`
Open the dev URL, paste the updated `language/samples/hello-world.chochi` into the editor. Expect:

- A 20×15 warehouse with floor + grid
- A shelf labelled `shelfA`, a package `package1`, a charger `charger1`, a waypoint ring at `home`
- A red wall from (8,0) to (8,4)
- The robot animates through `goTo(package1)` → `pickup(package1)` → `goTo(shelfA)` → `load(shelfA)` → `goTo(home)` → `charge()`
- No runtime error banner

- [ ] **Step 4: Commit**

```bash
git add frontend/src/Player/Player.tsx
git commit -m "feat(frontend): rewrite Player around Scene + simulation trace"
```

---

# Phase 7 — Linking tests & final sweep

## Task 12: Linking tests

**Files:**

- Modify: `language/test/linking/linking.test.ts`

- [ ] **Step 1: Rewrite the linking test**

Replace `language/test/linking/linking.test.ts` with:

```ts
import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model } from '../../src/language/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  const services = createChochiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chochi);
});

describe('Linking', () => {
  test('goTo resolves object references', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (5, 5)
      tasks:
        t:
          goTo(p)
    `);
    const step: any = doc.parseResult.value.tasks[0].steps[0];
    expect(step.targetRef?.ref?.name).toBe('p');
  });

  test('goTo resolves waypoint references', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      waypoints:
        home at (0, 0)
      tasks:
        t:
          goTo(home)
    `);
    const step: any = doc.parseResult.value.tasks[0].steps[0];
    expect(step.targetRef?.ref?.name).toBe('home');
  });

  test('unresolved reference produces a linker error', async () => {
    const doc = await parse(
      `
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      tasks:
        t:
          goTo(unknown)
    `,
      { validation: true } as any
    );
    const errors = (doc.diagnostics ?? []).filter((d: any) => d.severity === 1);
    expect(
      errors.some((d: any) =>
        d.message.toLowerCase().includes('could not resolve')
      )
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run all language tests**

Run: `npm --workspace language test`
Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add language/test/linking/linking.test.ts
git commit -m "test(language): linking tests for named goTo targets"
```

## Task 13: Final end-to-end verification

- [ ] **Step 1: Rebuild the worker and start the app**

Run: `npm run generate:worker`
Run: `npm --workspace frontend run dev`

- [ ] **Step 2: Manually exercise error cases**

Paste each of the following into the editor and verify the feedback:

a) Missing warehouse — expect red underline: "Missing required section 'warehouse'":

```
robot:
  start at (0, 0) facing right
tasks:
  t:
    goTo(0, 0)
```

b) Type mismatch — expect red underline on `pickup(s)`: "pickup requires a package, but 's' is a shelf":

```
warehouse:
  size(10, 10)
robot:
  start at (0, 0) facing right
objects:
  shelf s at (1, 1)
tasks:
  t:
    pickup(s)
```

c) Runtime obstacle collision — expect red banner over the 3D view: "goTo path crosses obstacle ...":

```
warehouse:
  size(10, 10)
robot:
  start at (0, 0) facing right
obstacles:
  at (2, 0)
tasks:
  t:
    goTo(5, 0)
```

- [ ] **Step 3: Commit any fixes surfaced by the smoke test, then stop**

If issues surface, they should be narrow (typos, minor animation tweaks). Address them, commit, and move on. Do **not** expand scope.

---

## Self-Review

- **Spec coverage:** Every spec section is addressed — warehouse (Task 1, 8, 9), robot (Task 1, 8, 11), objects (Tasks 1, 8, 9), obstacles (Tasks 1, 2, 3, 8, 9), waypoints (Tasks 1, 8, 9), tasks flattened into commands (Task 3, 8), static validations (Task 2), simulation validations (Task 8), execution order / no task invocations (Task 3, generator flatten in declaration order), rendering (Tasks 9, 10, 11).
- **Placeholder scan:** All code blocks are complete. No TBD / "similar to" / "fill in" references. Each task's test code is quotable and runnable.
- **Type consistency:** `Scene`, `WarehouseCommand`, `RobotState`, `SimulationResult` are used consistently across Tasks 3, 6, 8, 10, 11. The generator (Task 3) defines `Scene` via a local `interface` identical to the frontend `Scene` in `types.ts` (Task 6) — both hand-authored to match the Shared Data Contract block at the top of this plan.
- **Known risk:** Langium's generated AST guard function names (e.g. `isObstacleCell`) depend on the exact grammar shape. Task 2 Step 3 and Task 3 Step 3 call those guards by name. After `npm --workspace language run langium:generate` runs in Task 1, inspect `language/src/language/generated/ast.ts` and, if a guard name differs, rename the import in the validator/generator accordingly — don't change the grammar to work around it.
