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
