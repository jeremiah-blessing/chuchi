# Warehouse Robot DSL — Design

## Overview

Redesign the Chuchi language from a flat list of movement commands into a structured DSL for describing a warehouse environment and a robot that navigates it. The language sets up the environment (warehouse, robot, objects, obstacles, waypoints) and then defines named task blocks that the robot executes sequentially. Validation runs both at parse time (static) and during playback (simulation).

## Goals

- Replace the flat command stream with a sectioned, declarative structure.
- Give the DSL warehouse-aware vocabulary (`goTo`, `pickup`, `load`, `charge`, etc.) instead of raw `move(x, y)`.
- Let the user declare named entities (objects, waypoints, tasks) and reference them by name.
- Validate references, types, bounds, and collisions at parse time; validate physical constraints during simulation.

## Non-goals

- Automatic pathfinding. The robot follows explicit `goTo` steps; there is no planner that computes routes.
- Task reuse via calls. Tasks do not invoke other tasks. They are purely organizational groupings that execute top-to-bottom in declaration order.
- Multiple robots. One robot per program.
- Conditionals, loops, variables, or user-defined procedures. The language remains linear.

## Language Structure

Programs are organized into six top-level sections, each introduced by a label and colon. Each section may appear at most once. Sections may appear in any order.

```
warehouse:
  ...
robot:
  ...
objects:
  ...
obstacles:
  ...
waypoints:
  ...
tasks:
  ...
```

Required sections: `warehouse`, `robot`, `tasks`. Other sections are optional.

## Sections

### `warehouse`

Declares the grid dimensions. Integer grid; origin `(0, 0)` follows the existing Player's convention (to be confirmed when wiring up rendering).

```
warehouse:
  size(20, 15)
```

- `size(width, height)` — required. Both positive integers.

### `robot`

Declares the robot's starting state.

```
robot:
  start at (0, 0) facing right
```

- `start at (x, y)` — required. Must be within warehouse bounds and not on an obstacle.
- `facing <left|right|up|down>` — required. Sets the robot's initial orientation; affects relative `turn(left|right)` semantics.

### `objects`

Declares named entities placed in the warehouse. Each object has a type.

```
objects:
  shelf shelfA at (10, 2)
  shelf shelfB at (10, 5)
  package package1 at (3, 4)
  package package2 at (3, 7)
  charger charger1 at (0, 14)
```

- Form: `<type> <name> at (x, y)`
- Types:
  - `shelf` — target of `load` / `unload`. Rendered as a shelf. **Not** an obstacle (robot passes under).
  - `package` — target of `pickup` / `drop`. Rendered as a loose box. Not an obstacle.
  - `charger` — target of `charge`. Rendered as a charging station. Not an obstacle.
- Names are unique identifiers within the program.

### `obstacles`

Declares blocking cells the robot physically cannot enter. Obstacles and restricted zones are the same concept in this language.

```
obstacles:
  at (5, 5)
  at (5, 6)
  from (8, 0) to (8, 4)
```

- `at (x, y)` — a single blocked cell.
- `from (x1, y1) to (x2, y2)` — a rectangular region (inclusive on both corners).

### `waypoints`

Declares symbolic names for coordinates. Purely labels; no rendering, no interaction.

```
waypoints:
  home at (0, 0)
  loadingBay at (2, 2)
  exitDoor at (19, 14)
```

- Form: `<name> at (x, y)`
- Names are unique identifiers.

### `tasks`

Declares named blocks of verbs. Tasks execute sequentially in declaration order. There is no entry point; every task runs once, in order.

```
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

- A task is `<taskName>:` followed by one or more verb lines.
- Tasks do not call other tasks.
- Task names are unique identifiers.

## Verbs

Verbs appear only inside tasks.

| Verb                          | Semantics                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `goTo(name)`                  | Move to the position of the named object or waypoint.                                         |
| `goTo(x, y)`                  | Move to the given coordinate.                                                                 |
| `turn(left\|right\|up\|down)` | Change robot facing. `left`/`right` are relative to current facing; `up`/`down` are absolute. |
| `pickup(package)`             | Pick up the named `package` at robot's current position.                                      |
| `drop()`                      | Drop the currently carried package at robot's current position.                               |
| `load(shelf)`                 | Place the currently carried package onto the named `shelf`. Robot must be at the shelf.       |
| `unload(shelf)`               | Take an object off the named `shelf`. Robot must be at the shelf.                             |
| `scan(object)`                | Inspect the named object at robot's current position. No state change.                        |
| `charge()`                    | Recharge. Only valid when robot is at a charger's position.                                   |

Movement style (e.g. walk/jump/speed) is intentionally deferred for a future iteration.

## Validation

Two layers: **static** (reported by the language service as parse-time errors) and **simulation** (reported by the Player during animation playback).

### Static validations

1. Required sections present: `warehouse`, `robot`, `tasks`.
2. Each section appears at most once.
3. Names are unique across the union of object names, waypoint names, and task names.
4. All identifiers referenced by verbs resolve to a declared entity.
5. Type correctness:
   - `pickup(x)` — `x` must be a `package`.
   - `drop()` — no argument; runtime checks that something is carried.
   - `load(x)` / `unload(x)` — `x` must be a `shelf`.
   - `scan(x)` — `x` may be any object type.
   - `charge()` — no argument; runtime checks robot is at a charger.
6. All coordinates (robot start, objects, obstacles, waypoints, raw `goTo(x, y)` arguments) are within warehouse bounds.
7. No two objects share the same coordinates. No object overlaps an obstacle cell.
8. Robot start is not on an obstacle.

### Simulation validations

1. A `goTo` path that would cross an obstacle cell → error, stop simulation.
2. A `goTo` path that would leave warehouse bounds → error.
3. `pickup(p)` when robot not at `p`'s position → error.
4. `pickup(p)` when robot is already carrying something → error.
5. `drop()` when robot is not carrying anything → error.
6. `load(s)` when robot not at `s`'s position, or not carrying anything → error.
7. `unload(s)` when robot not at `s`'s position, or already carrying something → error.
8. `scan(o)` when robot not at `o`'s position → error.
9. `charge()` when robot not at any charger's position → error.

## Execution Semantics

- The robot holds state: `position`, `facing`, `carrying` (object name or none).
- Verbs are executed in order within each task; tasks are executed in order within the program.
- `goTo` moves the robot along an axis-aligned manhattan path: horizontal segment first, then vertical segment. Every cell along that path is checked against obstacles and warehouse bounds.
- Simulation errors halt playback at the offending step; prior successful steps remain as-is.

## Rendering

- Shelves, packages, chargers render as visually distinct sprites.
- Obstacles render as blocked cells (e.g. filled squares).
- Waypoints do not render.
- Robot animates movement, turning, and carrying state (e.g. shows package overlay when carrying).

## Example Program

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

## Out of Scope (Deferred)

- Movement style modifiers (speed, walk/jump).
- Multiple robots.
- Conditionals, loops, variables, procedures.
- Automatic pathfinding.
- Named zones (positive areas the robot must stay within).
- Events / triggers.
- Color commands (removed from prior language).
- Wait command (removed from prior language).
