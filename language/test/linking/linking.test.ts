import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model } from '../../src/language/generated/ast.js';

let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  const services = createChochiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chochi);
});

describe('Linking', () => {
  test('goTo resolves object references', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (5, 5)
      tasks:
        t:
          goTo(p)
    `);
    const step: any = doc.parseResult.value.tasks[0].steps[0];
    expect(step.targetRef?.ref?.name).toBe('p');
  });

  test('goTo resolves waypoint references', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      waypoints:
        home at (0, 0)
      tasks:
        t:
          goTo(home)
    `);
    const step: any = doc.parseResult.value.tasks[0].steps[0];
    expect(step.targetRef?.ref?.name).toBe('home');
  });

  test('unresolved reference produces a linker error', async () => {
    const doc = await parse(
      `
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      tasks:
        t:
          goTo(unknown)
    `,
      { validation: true } as any
    );
    const errors = (doc.diagnostics ?? []).filter((d: any) => d.severity === 1);
    expect(
      errors.some((d: any) =>
        d.message.toLowerCase().includes('could not resolve')
      )
    ).toBe(true);
  });
});
