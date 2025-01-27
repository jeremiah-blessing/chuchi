import { useState } from 'react';
import { Editor } from './Editor';
import { Player } from './Player';

export const App = () => {
  const [commands, setCommands] = useState<any[]>([]);

  return (
    <div className="w-screen min-h-screen flex">
      <div className="w-1/2">
        <Editor
          onCommands={(commands) =>
            setCommands(commands.filter((command) => command.type !== 'start'))
          }
        />
      </div>
      <div className="w-1/2">
        <Player commands={commands} />
      </div>
    </div>
  );
};
