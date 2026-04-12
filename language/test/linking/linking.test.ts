import { beforeAll, describe, expect, test } from 'vitest';
import { EmptyFileSystem } from 'langium';
import { parseHelper } from 'langium/test';
import { createChuchiServices } from '../../src/language/chuchi-module.js';
import { Model } from '../../src/language/generated/ast.js';
import { generateChuchiCommands } from '../../src/language/chuchi-generator.js';

let services: ReturnType<typeof createChuchiServices>;
let parse: ReturnType<typeof parseHelper<Model>>;

beforeAll(async () => {
  services = createChuchiServices(EmptyFileSystem);
  parse = parseHelper<Model>(services.Chuchi);
});

describe('Command generation', () => {
  test('generates commands from model', async () => {
    const document = await parse(`
      begin(1, 2)
      move(3, 4, walk)
      turn(right)
      wait(1)
      color(blue)
    `);

    expect(document.parseResult.parserErrors).toHaveLength(0);
    const commands = generateChuchiCommands(document.parseResult.value);

    expect(commands).toHaveLength(5);
    expect(commands[0]).toEqual({ type: 'start', x: 1, y: 2 });
    expect(commands[1]).toEqual({ type: 'walk', x: 3, y: 4 });
    expect(commands[2]).toEqual({ type: 'turn', direction: 'right' });
    expect(commands[3]).toEqual({ type: 'wait', duration: 1 });
    expect(commands[4]).toEqual({ type: 'color', value: 'blue' });
  });

  test('default start position when no begin', async () => {
    const document = await parse(`
      move(5, 5, jump)
    `);

    const commands = generateChuchiCommands(document.parseResult.value);
    expect(commands[0]).toEqual({ type: 'start', x: 0, y: 0 });
  });
});
