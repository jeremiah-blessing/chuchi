import { useState } from 'react';
import { Editor } from './Editor';
import { Player } from './Player';
import { ICommand } from './types';

export const App = () => {
  const [commands, setCommands] = useState<ICommand[]>([]);

  return (
    <div className="w-screen min-h-screen flex">
      <div className="flex-1 p-8">
        <div className="h-full rounded-xl overflow-hidden shadow-lg">
          <Editor onCommands={setCommands} />
        </div>
      </div>
      <div className="flex-1 p-8">
        <div className="h-full rounded-xl overflow-hidden border border-gray-100">
          <Player commands={commands} />
        </div>
      </div>
    </div>
  );
};
