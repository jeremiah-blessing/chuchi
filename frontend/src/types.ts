interface StartCommand {
  type: 'start';
  x: number;
  y: number;
}

interface WalkCommand {
  type: 'walk';
  x: number;
  y: number;
}

interface JumpCommand {
  type: 'jump';
  x: number;
  y: number;
}

export type ICommand = StartCommand | WalkCommand | JumpCommand;
