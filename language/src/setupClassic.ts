import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import monarchSyntax from './syntaxes/chuchi.monarch.js';

export const setupConfigClassic = (): UserConfig => {
  return {
    wrapperConfig: {
      serviceConfig: defineUserServices(),
      editorAppConfig: {
        $type: 'classic',
        languageId: 'chuchi',
        code: `// Chuchi Sample Code
begin(1, 0)
move(1, -9, jump)`,
        useDiffEditor: false,
        languageExtensionConfig: { id: 'langium' },
        languageDef: monarchSyntax,
        editorOptions: {
          'semanticHighlighting.enabled': true,
          theme: 'vs-dark',
        },
      },
    },
    languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (htmlElement: HTMLElement) => {
  const userConfig = setupConfigClassic();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig, htmlElement);

  const client = wrapper.getLanguageClient();

  client?.onNotification('browser/DocumentChange', (resp) => {
    // always store this new program in local storage

    let result = JSON.parse(resp.content);
    let commands = result.$commands;

    console.log(commands);
  });
};
