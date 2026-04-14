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
        if (!robot.carrying) return fail(i, `Robot has nothing to drop.`);
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
  if (command === 'up' || command === 'down') return command;
  const order: Direction[] = ['right', 'down', 'left', 'up'];
  const idx = order.indexOf(facing);
  const step = command === 'right' ? 1 : -1;
  return order[(idx + step + order.length) % order.length];
};
