import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import { syntax } from './syntax.js';

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
        languageDef: syntax,
        editorOptions: {
          'semanticHighlighting.enabled': true,
          theme: 'vs-dark',
        },
      },
    },
    languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (
  htmlElement: HTMLElement,
  onCommands: (commands: any[]) => void
) => {
  const userConfig = setupConfigClassic();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig, htmlElement);

  const client = wrapper.getLanguageClient();

  if (!client) {
    throw new Error('Unable to obtain language client!');
  }

  client.onNotification('browser/DocumentChange', (resp) => {
    const result = JSON.parse(resp.content);
    const diagnosistics = resp.diagnostics as Array<any>;

    if (diagnosistics.length === 0) {
      onCommands(result.$commands);
    }
  });

  return wrapper;
};
