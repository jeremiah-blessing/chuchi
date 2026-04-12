import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { ChuchiAstType, Begin, Move, Wait } from './generated/ast.js';
import type { ChuchiServices } from './chuchi-module.js';

const GRID_MAX = 22;

export function registerValidationChecks(services: ChuchiServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ChuchiValidator;
  const checks: ValidationChecks<ChuchiAstType> = {
    Move: validator.checkMoveRange,
    Begin: validator.checkBeginRange,
    Wait: validator.checkWaitDuration,
  };
  registry.register(checks, validator);
}

export class ChuchiValidator {
  checkMoveRange(move: Move, accept: ValidationAcceptor): void {
    if (move.x < 0 || move.x > GRID_MAX) {
      accept(
        'error',
        `x coordinate ${move.x} is outside the grid (0-${GRID_MAX}).`,
        { node: move, property: 'x' }
      );
    }
    if (move.y < 0 || move.y > GRID_MAX) {
      accept(
        'error',
        `y coordinate ${move.y} is outside the grid (0-${GRID_MAX}).`,
        { node: move, property: 'y' }
      );
    }
  }

  checkBeginRange(begin: Begin, accept: ValidationAcceptor): void {
    if (begin.x < 0 || begin.x > GRID_MAX) {
      accept(
        'error',
        `x coordinate ${begin.x} is outside the grid (0-${GRID_MAX}).`,
        { node: begin, property: 'x' }
      );
    }
    if (begin.y < 0 || begin.y > GRID_MAX) {
      accept(
        'error',
        `y coordinate ${begin.y} is outside the grid (0-${GRID_MAX}).`,
        { node: begin, property: 'y' }
      );
    }
  }

  checkWaitDuration(wait: Wait, accept: ValidationAcceptor): void {
    if (wait.duration <= 0) {
      accept('error', 'Wait duration must be greater than 0.', {
        node: wait,
        property: 'duration',
      });
    }
    if (wait.duration > 10) {
      accept('warning', 'Wait duration is very long (max recommended: 10s).', {
        node: wait,
        property: 'duration',
      });
    }
  }
}
