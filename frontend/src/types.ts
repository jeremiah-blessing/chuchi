interface StartCommand {
  type: 'start';
  x: number;
  y: number;
}

interface MoveCommand {
  type: 'move';
  x: number;
  y: number;
}

interface JumpCommand {
  type: 'jump';
  x: number;
  y: number;
}

export type ICommand = StartCommand | MoveCommand | JumpCommand;
