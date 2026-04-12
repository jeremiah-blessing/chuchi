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

interface TurnCommand {
  type: 'turn';
  direction: 'left' | 'right' | 'up' | 'down';
}

interface WaitCommand {
  type: 'wait';
  duration: number;
}

interface ColorCommand {
  type: 'color';
  value: string;
}

export type ICommand =
  | StartCommand
  | WalkCommand
  | JumpCommand
  | TurnCommand
  | WaitCommand
  | ColorCommand;
