import {
  MonacoEditorLanguageClientWrapper,
  WrapperConfig,
} from 'monaco-editor-wrapper';
import { useEffect, useRef } from 'react';

export const Editor = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doo = async () => {
      const wrapper = new MonacoEditorLanguageClientWrapper();
      const wrapperConfig: WrapperConfig = {
        $type: 'extendend',
        htmlContainer: containerRef.current!,
        editorAppConfig: {
          codeResources: {
            main: {
              text: 'print("Hello, World!")',
              uri: '/workspace/hello.py',
            },
          },
        },
      };

      await wrapper.initAndStart(wrapperConfig);
    };

    doo();
  }, []);

  return <div ref={containerRef}></div>;
};
