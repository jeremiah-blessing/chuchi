import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, type LangiumDocument } from 'langium';
import { parseHelper } from 'langium/test';
import type { Diagnostic } from 'vscode-languageserver-types';
import { createChuchiServices } from '../../src/language/chuchi-module.js';
import { Model } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChuchiServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  services = createChuchiServices(EmptyFileSystem);
  const doParse = parseHelper<Model>(services.Chuchi);
  parse = (input: string) => doParse(input, { validation: true });
});

describe('Validating', () => {
  test('valid program has no errors', async () => {
    const document = await parse(`
      begin(0, 0)
      move(5, 5, walk)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    expect(document.diagnostics).toHaveLength(0);
  });

  test('move out of grid upper bound', async () => {
    const document = await parse(`
      move(25, 5, walk)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const errors = document.diagnostics?.filter((d) => d.severity === 1) ?? [];
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((d) => d.message.includes('outside the grid'))).toBe(
      true
    );
  });

  test('begin out of grid', async () => {
    const document = await parse(`
      begin(30, 0)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const errors = document.diagnostics?.filter((d) => d.severity === 1) ?? [];
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((d) => d.message.includes('outside the grid'))).toBe(
      true
    );
  });

  test('wait with zero duration', async () => {
    const document = await parse(`
      wait(0)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const errors = document.diagnostics?.filter((d) => d.severity === 1) ?? [];
    expect(errors.some((d) => d.message.includes('greater than 0'))).toBe(true);
  });
});
