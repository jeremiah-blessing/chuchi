import {
  MonacoEditorLanguageClientWrapper,
  UserConfig,
} from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';
import { syntax } from './syntax.js';
import { registerChochiThemes } from './theme.js';
import { Scene } from '../types.js';

export const setupConfigClassic = (): UserConfig => {
  return {
    wrapperConfig: {
      serviceConfig: defineUserServices(),
      editorAppConfig: {
        $type: 'classic',
        languageId: 'chochi',
        code: `warehouse:
  size(20, 15)

robot:
  start at (0, 0) facing right

objects:
  shelf shelfA at (10, 2)
  package package1 at (3, 4)
  charger charger1 at (0, 14)

obstacles:
  from (8, 0) to (8, 1)

waypoints:
  home at (0, 0)

tasks:
  deliverPackage1:
    goTo(package1)
    pickup(package1)
    goTo(shelfA)
    load(shelfA)

  returnHome:
    goTo(charger1)
    charge()
    goTo(home)`,
        useDiffEditor: false,
        languageExtensionConfig: { id: 'langium' },
        languageDef: syntax,
        editorOptions: {
          'semanticHighlighting.enabled': true,
          theme: 'chochi-dark',
          minimap: { enabled: false },
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden',
            handleMouseWheel: false,
          },
          overviewRulerLanes: 0,
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          renderLineHighlight: 'none',
          fontSize: 16,
          padding: { top: 16, bottom: 16 },
        },
      },
    },
    languageClientConfig: configureWorker(),
  };
};

export const executeClassic = async (
  htmlElement: HTMLElement,
  onScene: (scene: Scene | null) => void
) => {
  const userConfig = setupConfigClassic();
  const wrapper = new MonacoEditorLanguageClientWrapper();
  await wrapper.initAndStart(userConfig, htmlElement);
  registerChochiThemes();
  const monaco = await import('monaco-editor');
  (window as any).monaco = monaco;
  monaco.editor.setTheme('chochi-dark');

  const client = wrapper.getLanguageClient();

  if (!client) {
    throw new Error('Unable to obtain language client!');
  }

  client.onNotification('browser/DocumentChange', (resp) => {
    const result = JSON.parse(resp.content);
    const diagnostics = resp.diagnostics as Array<unknown>;

    if (diagnostics.length === 0) {
      const scene = (result.$scene as Scene | undefined) ?? null;
      onScene(scene);
    } else {
      onScene(null);
    }
  });

  return wrapper;
};
