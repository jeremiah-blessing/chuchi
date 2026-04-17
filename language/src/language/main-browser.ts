import { DocumentState, EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  Diagnostic,
  NotificationType,
} from 'vscode-languageserver/browser.js';
import { createChochiServices } from './chochi-module.js';
import { Model } from './generated/ast.js';
import { generateScene } from './chochi-generator.js';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, Chochi } = createChochiServices({
  connection,
  ...EmptyFileSystem,
});

const jsonSerializer = Chochi.serializer.JsonSerializer;
type DocumentChange = {
  uri: string;
  content: string;
  diagnostics: Diagnostic[];
};
const documentChangeNotification = new NotificationType<DocumentChange>(
  'browser/DocumentChange'
);

shared.workspace.DocumentBuilder.onBuildPhase(
  DocumentState.Validated,
  (documents) => {
    // perform this for every validated document in this build phase batch
    for (const document of documents) {
      const module = document.parseResult.value as Model;

      try {
        (
          module as unknown as { $scene: ReturnType<typeof generateScene> }
        ).$scene = generateScene(module);
      } catch {
        // Generator may fail on partially-parsed or invalid ASTs —
        // skip scene generation so the LSP can still report diagnostics.
      }

      // inject the scene into the model
      // this is safe so long as you careful to not clobber existing properties

      // send the notification for this validated document,
      // with the serialized AST + generated commands as the content
      connection.sendNotification(documentChangeNotification, {
        uri: document.uri.toString(),
        content: jsonSerializer.serialize(module, {
          sourceText: true,
          textRegions: true,
        }),
        diagnostics: document.diagnostics ?? [],
      });
    }
  }
);

// Disable range formatting so only one "Format Document" entry appears
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const server = shared.lsp.LanguageServer as any;
const origBuild = server.buildInitializeResult.bind(server);
server.buildInitializeResult = (params: unknown) => {
  const result = origBuild(params);
  result.capabilities.documentRangeFormattingProvider = false;
  return result;
};

startLanguageServer(shared);
