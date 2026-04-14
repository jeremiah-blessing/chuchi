# Chochi

A tiny domain-specific language for programming a warehouse robot, with a
live 3D visualizer. Write a program in the Monaco-powered editor and watch
the robot execute it in an orthographic Three.js scene.

## Monorepo layout

- `language/` — Langium grammar, validator, scene generator, CLI, and the
  language-server worker bundle consumed by the frontend.
- `frontend/` — React + Vite app. Monaco editor on the left, React Three
  Fiber player on the right, driven by GSAP timelines.

## Getting started

```bash
npm install
npm run generate:worker   # regenerate Langium artifacts + language worker
npm --workspace frontend run dev
```

Open the URL Vite prints. The language-server worker lives at
`frontend/public/chochiWorker.js` and is rebuilt by `generate:worker`.

## The language

A Chochi program declares a warehouse, the robot's start state, the
objects and obstacles in it, optional named waypoints, and one or more
named tasks. Commands run top-to-bottom, task-by-task.

```chochi
warehouse:
  size(20, 15)

robot:
  start at (0, 0) facing right

objects:
  shelf shelfA at (10, 2)
  package package1 at (3, 4)
  charger charger1 at (0, 14)

obstacles:
  from (8, 0) to (8, 1)

waypoints:
  home at (0, 0)

tasks:
  deliverPackage1:
    goTo(package1)
    pickup(package1)
    goTo(shelfA)
    load(shelfA)

  returnHome:
    goTo(charger1)
    charge()
    goTo(home)
```

### Sections

| Section     | Purpose                                                    |
| ----------- | ---------------------------------------------------------- |
| `warehouse` | `size(width, height)` defines the grid.                    |
| `robot`     | `start at (x, y) facing <left\|right\|up\|down>`.          |
| `objects`   | `shelf`, `package`, or `charger` at a coordinate.          |
| `obstacles` | Single cells (`at (x, y)`) or rectangles (`from … to …`).  |
| `waypoints` | Named points the robot can `goTo` without an object there. |
| `tasks`     | Named sequences of commands.                               |

### Commands

| Command                     | Effect                                            |
| --------------------------- | ------------------------------------------------- |
| `goTo(name)` / `goTo(x, y)` | Manhattan path to the target, avoiding obstacles. |
| `turn(dir)`                 | Rotate to `left`, `right`, `up`, or `down`.       |
| `pickup(pkg)`               | Pick up a package the robot is standing on.       |
| `drop()`                    | Drop whatever the robot is carrying.              |
| `load(shelf)`               | Place the carried package onto a shelf.           |
| `unload(shelf)`             | Take the top package from a shelf.                |
| `scan(name)`                | Inspect an object at the robot's cell.            |
| `charge()`                  | Charge at the current charger.                    |

Validation happens in the editor (bounds checks, collision checks, name
uniqueness, and command-target type checks). Runtime errors from the
simulator are surfaced as overlays in the player.

## How it works

1. Monaco sends edits to the Langium language server running in a Web
   Worker.
2. On every valid parse the server emits a `Scene` JSON blob via
   `browser/DocumentChange`.
3. The frontend runs a pure `simulate(scene)` to produce a step trace.
4. `buildRobotTimeline` composes a GSAP timeline from the trace; the
   player drives the 3D robot, carried package, shelf contents, and HUD.

## Scripts

```bash
npm run generate:worker          # regen Langium + rebuild chochiWorker.js
npm --workspace frontend run dev     # Vite dev server
npm --workspace frontend run build   # production build
npm --workspace frontend run test    # frontend tests (simulator)
npm --workspace language run test    # language tests (parse/validate/gen)
npm run format                       # prettier check
```

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds the worker and the
frontend, then publishes `frontend/dist` to GitHub Pages at
`/chochi/`.
