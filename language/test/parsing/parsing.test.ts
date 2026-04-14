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
    const tasks = document.parseResult.value.tasks;
    expect(tasks.map((t) => t.name)).toEqual(['first', 'second']);
  });
});
