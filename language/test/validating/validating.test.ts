import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { Model } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChochiServices>;
let parse: (input: string) => Promise<{
  diagnostics?: import('vscode-languageserver-types').Diagnostic[];
  parseResult: any;
}>;

beforeAll(async () => {
  services = createChochiServices(EmptyFileSystem);
  const doParse = parseHelper<Model>(services.Chochi);
  parse = (input: string) => doParse(input, { validation: true });
});

const errors = (doc: any) =>
  (doc.diagnostics ?? []).filter((d: any) => d.severity === 1);

describe('Validating', () => {
  test('valid program has no errors', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (3, 3)
      tasks:
        t:
          goTo(p)
          pickup(p)
    `);
    expect(doc.parseResult.parserErrors).toHaveLength(0);
    expect(errors(doc)).toHaveLength(0);
  });

  test('reports missing required sections', async () => {
    const doc = await parse(`tasks:
  t:
    goTo(0, 0)
`);
    const msgs = errors(doc).map((d: any) => d.message);
    expect(msgs.some((m) => m.includes('warehouse'))).toBe(true);
    expect(msgs.some((m) => m.includes('robot'))).toBe(true);
  });

  test('reports objects outside warehouse bounds', async () => {
    const doc = await parse(`
      warehouse:
        size(5, 5)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (10, 10)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('outside warehouse'))
    ).toBe(true);
  });

  test('reports robot start on an obstacle', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (2, 2) facing right
      obstacles:
        at (2, 2)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some(
        (d: any) =>
          d.message.includes('robot') && d.message.includes('obstacle')
      )
    ).toBe(true);
  });

  test('reports duplicate names across objects and waypoints', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package home at (1, 1)
      waypoints:
        home at (2, 2)
      tasks:
        t:
          goTo(home)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('Duplicate'))).toBe(
      true
    );
  });

  test('reports pickup on a non-package', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        shelf s at (1, 1)
      tasks:
        t:
          pickup(s)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('package'))).toBe(
      true
    );
  });

  test('reports load on a non-shelf', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (1, 1)
      tasks:
        t:
          load(p)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('shelf'))).toBe(
      true
    );
  });

  test('reports overlapping obstacle and object', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p at (3, 3)
      obstacles:
        at (3, 3)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(errors(doc).some((d: any) => d.message.includes('overlap'))).toBe(
      true
    );
  });

  test('reports two objects at the same coordinate', async () => {
    const doc = await parse(`
      warehouse:
        size(10, 10)
      robot:
        start at (0, 0) facing right
      objects:
        package p1 at (3, 3)
        package p2 at (3, 3)
      tasks:
        t:
          goTo(0, 0)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('same coordinate'))
    ).toBe(true);
  });

  test('reports goTo(x, y) outside warehouse', async () => {
    const doc = await parse(`
      warehouse:
        size(5, 5)
      robot:
        start at (0, 0) facing right
      tasks:
        t:
          goTo(10, 10)
    `);
    expect(
      errors(doc).some((d: any) => d.message.includes('outside warehouse'))
    ).toBe(true);
  });
});
