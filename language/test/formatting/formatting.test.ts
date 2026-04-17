import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem, TextDocument } from 'langium';
import { parseHelper } from 'langium/test';
import { createChochiServices } from '../../src/language/chochi-module.js';
import { ChochiFormatter } from '../../src/language/chochi-formatter.js';
import type { Model } from '../../src/language/generated/ast.js';

let services: ReturnType<typeof createChochiServices>;
let parse: ReturnType<typeof parseHelper<Model>>;
const formatter = new ChochiFormatter();

beforeAll(async () => {
  services = createChochiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chochi);
});

async function formatCode(input: string): Promise<string> {
  const document = await parse(input);
  const edits = await formatter.formatDocument(document, {
    textDocument: { uri: document.uri.toString() },
    options: { tabSize: 2, insertSpaces: true },
  });
  const textDoc = TextDocument.create(
    document.uri.toString(),
    'chochi',
    0,
    input
  );
  let result = input;
  // Apply edits in reverse order to preserve positions
  for (const edit of edits.sort(
    (a, b) => textDoc.offsetAt(b.range.start) - textDoc.offsetAt(a.range.start)
  )) {
    const start = textDoc.offsetAt(edit.range.start);
    const end = textDoc.offsetAt(edit.range.end);
    result = result.substring(0, start) + edit.newText + result.substring(end);
  }
  return result;
}

describe('Formatter', () => {
  test('formats a minimal program', async () => {
    const input = `warehouse:size(5,5)\nrobot:start at(0,0)facing right\ntasks:\nt:goTo(2,2)`;
    const result = await formatCode(input);
    expect(result).toBe(
      `warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\ntasks :\n  t :\n    goTo(2, 2)`
    );
  });

  test('formats objects section with indentation', async () => {
    const input = `warehouse:size(5,5)\nrobot:start at(0,0)facing right\nobjects:\npackage box at(3,3)\nshelf rack at(4,0)\ntasks:\nt:goTo(3,3)\npickup(box)`;
    const result = await formatCode(input);
    expect(result).toContain(
      'objects :\n  package box at (3, 3)\n  shelf rack at (4, 0)'
    );
  });

  test('formats obstacles section', async () => {
    const input = `warehouse:size(10,10)\nrobot:start at(0,0)facing right\nobstacles:\nat(2,2)\nfrom(1,1)to(3,3)\ntasks:\nt:goTo(5,5)`;
    const result = await formatCode(input);
    expect(result).toContain(
      'obstacles :\n  at (2, 2)\n  from (1, 1) to (3, 3)'
    );
  });

  test('formats waypoints section', async () => {
    const input = `warehouse:size(10,10)\nrobot:start at(0,0)facing right\nwaypoints:\ndock at(0,4)\ntasks:\nt:goTo(dock)`;
    const result = await formatCode(input);
    expect(result).toContain('waypoints :\n  dock at (0, 4)');
  });

  test('formats all command types', async () => {
    const input = `warehouse:size(6,6)\nrobot:start at(0,0)facing right\nobjects:\npackage box at(3,0)\nshelf rack at(5,0)\ncharger plug at(5,5)\ntasks:\nt:goTo(3,0)\npickup(box)\nturn(left)\ndrop()\nload(rack)\nunload(rack)\nscan(box)\ncharge()`;
    const result = await formatCode(input);
    expect(result).toContain('goTo(3, 0)');
    expect(result).toContain('pickup(box)');
    expect(result).toContain('turn(left)');
    expect(result).toContain('drop()');
    expect(result).toContain('load(rack)');
    expect(result).toContain('unload(rack)');
    expect(result).toContain('scan(box)');
    expect(result).toContain('charge()');
  });

  test('idempotent — formatting already-formatted code produces same result', async () => {
    const formatted = `warehouse : size(5, 5)\nrobot : start at (0, 0) facing right\ntasks :\n  t :\n    goTo(2, 2)`;
    const result = await formatCode(formatted);
    expect(result).toBe(formatted);
  });
});
