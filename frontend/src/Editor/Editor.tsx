import { useEffect, useRef } from 'react';
import { configureMonacoWorkers } from './setupCommon';
import { executeClassic } from './setupClassic';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import * as monaco from 'monaco-editor';
import { Scene } from '../types';
import { Theme } from '../theme';

interface EditorProps {
  onScene?: (scene: Scene | null) => void;
  theme?: Theme;
}

export const Editor = ({ onScene = () => {}, theme = 'dark' }: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditorLanguageClientWrapper | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    const createEditor = async () => {
      configureMonacoWorkers();
      const editor = await executeClassic(containerRef.current!, onScene);
      editorRef.current = editor;
      readyRef.current = true;
    };

    createEditor();

    return () => {
      editorRef.current?.dispose();
    };
  }, [onScene]);

  useEffect(() => {
    if (readyRef.current) {
      monaco.editor.setTheme(theme === 'dark' ? 'chochi-dark' : 'chochi-light');
    }
  }, [theme]);

  return (
    <div
      data-testid="editor-container"
      className={`w-full h-full px-4 transition-colors duration-300 ${
        theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#fffffe]'
      }`}
      ref={containerRef}
    />
  );
};
