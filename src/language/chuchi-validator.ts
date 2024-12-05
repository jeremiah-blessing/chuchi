import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { ChuchiAstType, Move } from './generated/ast.js';
import type { ChuchiServices } from './chuchi-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: ChuchiServices) {
  const registry = services.validation.ValidationRegistry;
  const validator = services.validation.ChuchiValidator;
  const checks: ValidationChecks<ChuchiAstType> = {
    Move: validator.checkIfOutOfRange,
  };
  registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class ChuchiValidator {
  checkIfOutOfRange(move: Move, accept: ValidationAcceptor): void {
    if (move) {
      if (move.x < 0) {
        accept('error', 'Move is out of range.', { node: move, property: 'x' });
      }
      if (move.y < 0) {
        accept('error', 'Move is out of range.', { node: move, property: 'y' });
      }
    }
  }
}
