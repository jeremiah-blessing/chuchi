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
