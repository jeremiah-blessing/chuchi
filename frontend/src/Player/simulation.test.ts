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
    const path = result.steps.at(-1)!.robot.path;
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
