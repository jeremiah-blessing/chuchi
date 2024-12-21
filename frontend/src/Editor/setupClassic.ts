import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
// import { configureWorker, defineUserServices } from './setupCommon.js';
import { syntax } from './syntax.js';

export const setupConfigClassic = (): UserConfig => {
  return {
    wrapperConfig: {
      //   serviceConfig: defineUserServices(),
      editorAppConfig: {
        $type: 'classic',
        languageId: 'chuchi',
        code: `// Chuchi is running in the web!`,
        useDiffEditor: false,
        languageExtensionConfig: { id: 'langium' },
        languageDef: syntax,
        editorOptions: {
          'semanticHighlighting.enabled': true,
          theme: 'vs-dark',
        },
      },
    },
    // languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (htmlElement: HTMLElement) => {
  const userConfig = setupConfigClassic();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig, htmlElement);
};
