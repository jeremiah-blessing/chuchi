import * as monaco from 'monaco-editor';

const darkRules: monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword.section.chochi', foreground: 'c792ea', fontStyle: 'bold' },
  { token: 'keyword.command.chochi', foreground: '82aaff' },
  { token: 'keyword.positional.chochi', foreground: '89ddff' },
  { token: 'type.chochi', foreground: 'ffcb6b', fontStyle: 'bold' },
  { token: 'constant.direction.chochi', foreground: 'f78c6c' },
  { token: 'identifier.chochi', foreground: 'd6deeb' },
  { token: 'number.chochi', foreground: 'f78c6c' },
  { token: 'delimiter.chochi', foreground: '637777' },
  { token: 'comment', foreground: '637777', fontStyle: 'italic' },
];

const lightRules: monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword.section.chochi', foreground: '7c3aed', fontStyle: 'bold' },
  { token: 'keyword.command.chochi', foreground: '2563eb' },
  { token: 'keyword.positional.chochi', foreground: '0891b2' },
  { token: 'type.chochi', foreground: 'b45309', fontStyle: 'bold' },
  { token: 'constant.direction.chochi', foreground: 'c2410c' },
  { token: 'identifier.chochi', foreground: '1f2937' },
  { token: 'number.chochi', foreground: 'c2410c' },
  { token: 'delimiter.chochi', foreground: '94a3b8' },
  { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
];

export const registerChochiThemes = () => {
  monaco.editor.defineTheme('chochi-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: darkRules,
    colors: {
      'editor.background': '#1E1E1E',
    },
  });

  monaco.editor.defineTheme('chochi-light', {
    base: 'vs',
    inherit: true,
    rules: lightRules,
    colors: {
      'editor.background': '#fffffe',
    },
  });
};
