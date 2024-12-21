import { Editor } from './Editor';
import { Player } from './Player';

export const App = () => {
  return (
    <div className="w-screen min-h-screen flex">
      <div className="w-1/2">
        <Editor />
      </div>
      <div className="w-1/2">
        <Player />
      </div>
    </div>
  );
};
