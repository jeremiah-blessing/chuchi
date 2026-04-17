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
