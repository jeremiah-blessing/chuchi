import { Editor } from './Editor';
import { Player } from './Player';

export const App = () => {
  return (
    <div className="w-screen min-h-screen flex">
      <div className="w-1/2">
        <Editor onCommands={(commands) => console.log(commands)} />
      </div>
      <div className="w-1/2">
        <Player />
      </div>
    </div>
  );
};
