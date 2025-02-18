import { useEffect, useRef } from 'react';
import { configureMonacoWorkers } from './setupCommon';
import { executeClassic } from './setupClassic';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';
import { ICommand } from '../types';

interface EditorProps {
  onCommands?: (commands: ICommand[]) => void;
}

export const Editor = ({ onCommands = () => {} }: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditorLanguageClientWrapper | null>(null);

  useEffect(() => {
    const createEditor = async () => {
      configureMonacoWorkers();
      const editor = await executeClassic(containerRef.current!, onCommands);
      editorRef.current = editor;
    };

    createEditor();

    return () => {
      editorRef.current?.dispose();
    };
  }, [onCommands]);

  return <div className="w-full h-full" ref={containerRef}></div>;
};
