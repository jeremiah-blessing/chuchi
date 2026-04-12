import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { createChuchiServices } from '../../src/language/chuchi-module.js';
import { Model, isModel } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChuchiServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  services = createChuchiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chuchi);
});

describe('Parsing tests', () => {
  test('parse begin and move', async () => {
    const document = await parse(`
      begin(1, 2)
      move(3, 4, walk)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const model = document.parseResult.value;
    expect(isModel(model)).toBe(true);
    expect(model.begin?.x).toBe(1);
    expect(model.begin?.y).toBe(2);
    expect(model.actions).toHaveLength(1);
  });

  test('parse all command types', async () => {
    const document = await parse(`
      begin(0, 0)
      move(5, 5, jump)
      turn(left)
      wait(2)
      color(red)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.actions).toHaveLength(4);
  });

  test('parse without begin', async () => {
    const document = await parse(`
      move(1, 1, walk)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.parseResult.value.begin).toBeUndefined();
    expect(document.parseResult.value.actions).toHaveLength(1);
  });
});
