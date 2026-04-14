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
