import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type {
  ChuchiAstType,
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
} from './generated/ast.js';
import type { ChuchiServices } from './chuchi-module.js';

export function registerValidationChecks(services: ChuchiServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ChuchiValidator;
  const checks: ValidationChecks<ChuchiAstType> = {
    Model: validator.checkModel,
    GoTo: validator.checkGoTo,
    Pickup: validator.checkPickupIsPackage,
    Load: validator.checkLoadIsShelf,
    Unload: validator.checkUnloadIsShelf,
  };
  registry.register(checks, validator);
}

export class ChuchiValidator {
  checkModel = (model: Model, accept: ValidationAcceptor): void => {
    // Required sections
    if (!model.robot) {
      accept('error', "Missing required section 'robot'.", { node: model });
    }
    if (!model.tasks || model.tasks.length === 0) {
      accept('error', "Missing required section 'tasks'.", { node: model });
    }
    if (!model.warehouse) {
      accept('error', "Missing required section 'warehouse'.", { node: model });
      return; // other checks depend on warehouse
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
          `robot start (${x}, ${y}) is outside warehouse bounds (${width} x ${height}).`,
          { node: model.robot, property: 'x' }
        );
      }
      if (obstacleCells.has(cellKey(x, y))) {
        accept('error', `robot start (${x}, ${y}) is on an obstacle.`, {
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
        if (!inBounds(o.x!, o.y!)) {
          accept(
            'error',
            `Obstacle at (${o.x}, ${o.y}) is outside warehouse bounds.`,
            { node: o }
          );
        }
      } else if (isObstacleRect(o)) {
        if (!inBounds(o.x1!, o.y1!) || !inBounds(o.x2!, o.y2!)) {
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
      cells.add(cellKey(o.x!, o.y!));
    } else if (isObstacleRect(o)) {
      const xMin = Math.min(o.x1!, o.x2!);
      const xMax = Math.max(o.x1!, o.x2!);
      const yMin = Math.min(o.y1!, o.y2!);
      const yMax = Math.max(o.y1!, o.y2!);
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
