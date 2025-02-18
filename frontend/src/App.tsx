import { useState } from 'react';
import { Editor } from './Editor';
import { Player } from './Player';
import { ICommand } from './types';

export const App = () => {
  const [commands, setCommands] = useState<ICommand[]>([]);

  return (
    <div className="w-screen min-h-screen flex">
      <div className="w-1/2">
        <Editor onCommands={setCommands} />
      </div>
      <div className="w-1/2">
        <Player commands={commands} />
      </div>
    </div>
  );
};
