import { Model } from './generated/ast.js';

export const generateChuchiCommands = (model: Model): any[] => {
  const commands = [];
  commands.push({
    type: 'start',
    x: model.begin?.x || 0,
    y: model.begin?.y || 0,
  });
  for (const action of model.actions) {
    commands.push({ type: action.type, x: action.x, y: action.y });
  }
  return commands;
};
