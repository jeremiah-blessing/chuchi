import type { Model } from '../language/generated/ast.js';
import { isMove, isTurn, isWait, isColor } from '../language/generated/ast.js';
import { expandToNode, joinToNode, toString } from 'langium/generate';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { extractDestinationAndName } from './cli-util.js';

export function generateJavaScript(
  model: Model,
  filePath: string,
  destination: string | undefined
): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.js`;

  const fileNode = expandToNode`
        ${joinToNode(
          model.actions,
          (action) => {
            if (isMove(action))
              return `move(${action.x}, ${action.y}, "${action.type}")`;
            if (isTurn(action)) return `turn("${action.direction}")`;
            if (isWait(action)) return `wait(${action.duration})`;
            if (isColor(action)) return `color("${action.value}")`;
            return '';
          },
          { appendNewLineIfNotEmpty: true }
        )}
    `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}
