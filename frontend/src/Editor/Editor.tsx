import { useEffect, useRef } from 'react';
import { configureMonacoWorkers } from './setupCommon';
import { executeClassic } from './setupClassic';
import { MonacoEditorLanguageClientWrapper } from 'monaco-editor-wrapper';

export const Editor = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditorLanguageClientWrapper | null>(null);

  useEffect(() => {
    const createEditor = async () => {
      configureMonacoWorkers();
      const editor = await executeClassic(containerRef.current!);
      editorRef.current = editor;
    };

    createEditor();

    return () => {
      editorRef.current?.dispose();
    };
  }, []);

  return <div style={{ height: 700 }} ref={containerRef}></div>;
};
