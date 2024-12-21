import getEditorServiceOverride from '@codingame/monaco-vscode-editor-service-override';
import getKeybindingsServiceOverride from '@codingame/monaco-vscode-keybindings-service-override';
import { LanguageClientConfig } from 'monaco-editor-wrapper';
import { useOpenEditorStub } from 'monaco-editor-wrapper/vscode/services';
import { useWorkerFactory } from 'monaco-editor-wrapper/workerFactory';

export const defineUserServices = () => {
  return {
    userServices: {
      ...getEditorServiceOverride(useOpenEditorStub),
      ...getKeybindingsServiceOverride(),
    },
    debugLogging: true,
  };
};

export const configureMonacoWorkers = () => {
  useWorkerFactory({
    ignoreMapping: true,
    workerLoaders: {
      editorWorkerService: () =>
        new Worker(
          new URL(
            'monaco-editor/esm/vs/editor/editor.worker.js',
            import.meta.url
          ),
          { type: 'module' }
        ),
    },
  });
};

export const configureWorker = (): LanguageClientConfig => {
  const lsWorker = new Worker('/chuchiWorker.js', {
    type: 'module',
    name: 'Chuchi Language Server',
  });

  return {
    options: {
      $type: 'WorkerDirect',
      worker: lsWorker,
    },
  };
};
