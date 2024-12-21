import { DocumentState, EmptyFileSystem } from 'langium';
import { startLanguageServer } from 'langium/lsp';
import {
  BrowserMessageReader,
  BrowserMessageWriter,
  createConnection,
  Diagnostic,
  NotificationType,
} from 'vscode-languageserver/browser.js';
import { createChuchiServices } from './chuchi-module.js';
import { Model } from './generated/ast.js';

declare const self: DedicatedWorkerGlobalScope;

const messageReader = new BrowserMessageReader(self);
const messageWriter = new BrowserMessageWriter(self);

const connection = createConnection(messageReader, messageWriter);

const { shared, Chuchi } = createChuchiServices({
  connection,
  ...EmptyFileSystem,
});

const jsonSerializer = Chuchi.serializer.JsonSerializer;
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

      (module as unknown as { $commands: any[] }).$commands = [
        { message: 'Hi Jeremiah!' },
      ];

      // inject the commands into the model
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

startLanguageServer(shared);
