import { Model, isMove, isTurn, isWait, isColor } from './generated/ast.js';

export const generateChuchiCommands = (model: Model): any[] => {
  const commands = [];
  commands.push({
    type: 'start',
    x: model.begin?.x || 0,
    y: model.begin?.y || 0,
  });
  for (const action of model.actions) {
    if (isMove(action)) {
      commands.push({ type: action.type, x: action.x, y: action.y });
    } else if (isTurn(action)) {
      commands.push({ type: 'turn', direction: action.direction });
    } else if (isWait(action)) {
      commands.push({ type: 'wait', duration: action.duration });
    } else if (isColor(action)) {
      commands.push({ type: 'color', value: action.value });
    }
  }
  return commands;
};
