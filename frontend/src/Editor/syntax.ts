export const syntax = {
  sections: [
    'warehouse',
    'robot',
    'objects',
    'obstacles',
    'waypoints',
    'tasks',
  ],
  commands: [
    'goTo',
    'turn',
    'pickup',
    'drop',
    'load',
    'unload',
    'scan',
    'charge',
  ],
  kinds: ['shelf', 'package', 'charger'],
  directions: ['left', 'right', 'up', 'down'],
  positional: ['size', 'start', 'at', 'facing', 'from', 'to'],
  operators: [',', ':'],
  symbols: /\(|\)|,|:/,

  tokenizer: {
    initial: [
      {
        regex: /[_a-zA-Z][\w_]*/,
        action: {
          cases: {
            '@sections': { token: 'keyword.section.chochi' },
            '@commands': { token: 'keyword.command.chochi' },
            '@kinds': { token: 'type.chochi' },
            '@directions': { token: 'constant.direction.chochi' },
            '@positional': { token: 'keyword.positional.chochi' },
            '@default': { token: 'identifier.chochi' },
          },
        },
      },
      {
        regex: /(?:(?:-?[0-9]+)?\.[0-9]+)|-?[0-9]+/,
        action: { token: 'number.chochi' },
      },
      { include: '@whitespace' },
      {
        regex: /@symbols/,
        action: {
          cases: {
            '@operators': { token: 'delimiter.chochi' },
            '@default': { token: '' },
          },
        },
      },
    ],
    whitespace: [
      { regex: /\s+/, action: { token: 'white' } },
      { regex: /\/\*/, action: { token: 'comment', next: '@comment' } },
      { regex: /\/\/[^\n\r]*/, action: { token: 'comment' } },
    ],
    comment: [
      { regex: /[^/\*]+/, action: { token: 'comment' } },
      { regex: /\*\//, action: { token: 'comment', next: '@pop' } },
      { regex: /[/\*]/, action: { token: 'comment' } },
    ],
  },
};
