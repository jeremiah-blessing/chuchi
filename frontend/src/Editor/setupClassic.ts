import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import { syntax } from './syntax.js';
import { ICommand } from '../types.js';

export const setupConfigClassic = (): UserConfig => {
  return {
    wrapperConfig: {
      serviceConfig: defineUserServices(),
      editorAppConfig: {
        $type: 'classic',
        languageId: 'chuchi',
        code: `begin(1, 0)
move(1, 9, jump)
move(10, 10, jump)`,
        useDiffEditor: false,
        languageExtensionConfig: { id: 'langium' },
        languageDef: syntax,
        editorOptions: {
          'semanticHighlighting.enabled': true,
          theme: 'vs-dark',
          minimap: { enabled: false },
        },
      },
    },
    languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (
  htmlElement: HTMLElement,
  onCommands: (commands: ICommand[]) => void
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
    const diagnosistics = resp.diagnostics as Array<unknown>;

    if (diagnosistics.length === 0) {
      onCommands(result.$commands);
    }
  });

  return wrapper;
};
