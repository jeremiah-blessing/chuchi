import * as monaco from 'monaco-editor';

const darkRules: monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword.section.chuchi', foreground: 'c792ea', fontStyle: 'bold' },
  { token: 'keyword.command.chuchi', foreground: '82aaff' },
  { token: 'keyword.positional.chuchi', foreground: '89ddff' },
  { token: 'type.chuchi', foreground: 'ffcb6b', fontStyle: 'bold' },
  { token: 'constant.direction.chuchi', foreground: 'f78c6c' },
  { token: 'identifier.chuchi', foreground: 'd6deeb' },
  { token: 'number.chuchi', foreground: 'f78c6c' },
  { token: 'delimiter.chuchi', foreground: '637777' },
  { token: 'comment', foreground: '637777', fontStyle: 'italic' },
];

const lightRules: monaco.editor.ITokenThemeRule[] = [
  { token: 'keyword.section.chuchi', foreground: '7c3aed', fontStyle: 'bold' },
  { token: 'keyword.command.chuchi', foreground: '2563eb' },
  { token: 'keyword.positional.chuchi', foreground: '0891b2' },
  { token: 'type.chuchi', foreground: 'b45309', fontStyle: 'bold' },
  { token: 'constant.direction.chuchi', foreground: 'c2410c' },
  { token: 'identifier.chuchi', foreground: '1f2937' },
  { token: 'number.chuchi', foreground: 'c2410c' },
  { token: 'delimiter.chuchi', foreground: '94a3b8' },
  { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
];

export const registerChuchiThemes = () => {
  monaco.editor.defineTheme('chuchi-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: darkRules,
    colors: {
      'editor.background': '#1E1E1E',
    },
  });

  monaco.editor.defineTheme('chuchi-light', {
    base: 'vs',
    inherit: true,
    rules: lightRules,
    colors: {
      'editor.background': '#fffffe',
    },
  });
};
