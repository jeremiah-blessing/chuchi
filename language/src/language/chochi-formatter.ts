import type { AstNode } from 'langium';
import { AbstractFormatter, Formatting } from 'langium/lsp';
import {
  isModel,
  isWarehouse,
  isRobot,
  isWarehouseObject,
  isObstacleCell,
  isObstacleRect,
  isWaypoint,
  isTask,
  isGoTo,
  isTurn,
  isPickup,
  isDrop,
  isLoad,
  isUnload,
  isScan,
  isCharge,
} from './generated/ast.js';

export class ChochiFormatter extends AbstractFormatter {
  protected format(node: AstNode): void {
    if (isModel(node)) {
      this.formatModel(node);
    } else if (isWarehouse(node)) {
      this.formatWarehouse(node);
    } else if (isRobot(node)) {
      this.formatRobot(node);
    } else if (isWarehouseObject(node)) {
      this.formatWarehouseObject(node);
    } else if (isObstacleCell(node)) {
      this.formatObstacleCell(node);
    } else if (isObstacleRect(node)) {
      this.formatObstacleRect(node);
    } else if (isWaypoint(node)) {
      this.formatWaypoint(node);
    } else if (isTask(node)) {
      this.formatTask(node);
    } else if (isGoTo(node)) {
      this.formatGoTo(node);
    } else if (isTurn(node)) {
      this.formatParenCommand(node, 'turn');
    } else if (isPickup(node)) {
      this.formatParenCommand(node, 'pickup');
    } else if (isLoad(node)) {
      this.formatParenCommand(node, 'load');
    } else if (isUnload(node)) {
      this.formatParenCommand(node, 'unload');
    } else if (isScan(node)) {
      this.formatParenCommand(node, 'scan');
    } else if (isDrop(node)) {
      this.formatEmptyParenCommand(node, 'drop');
    } else if (isCharge(node)) {
      this.formatEmptyParenCommand(node, 'charge');
    }
  }

  private formatModel(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    // Each top-level section on its own line, no indentation
    f.keywords(
      'warehouse',
      'robot',
      'objects',
      'obstacles',
      'waypoints',
      'tasks'
    ).prepend(Formatting.newLine({ allowMore: true }));
    // The ':' after objects/obstacles/waypoints/tasks lives in the Model rule
    f.keywords(':').surround(Formatting.oneSpace());
  }

  // warehouse : size(5, 5)
  private formatWarehouse(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.keyword('warehouse').append(Formatting.oneSpace());
    f.keyword(':').append(Formatting.oneSpace());
    f.keyword('size').append(Formatting.noSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // robot : start at (0, 0) facing right
  private formatRobot(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.keyword('robot').append(Formatting.oneSpace());
    f.keyword(':').append(Formatting.oneSpace());
    f.keyword('start').append(Formatting.oneSpace());
    f.keyword('at').append(Formatting.oneSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword('facing').append(Formatting.oneSpace());
  }

  // package box at (3, 3)
  private formatWarehouseObject(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.node(node).prepend(Formatting.indent());
    f.property('kind').append(Formatting.oneSpace());
    f.property('name').append(Formatting.oneSpace());
    f.keyword('at').append(Formatting.oneSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // at (2, 2)
  private formatObstacleCell(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.node(node).prepend(Formatting.indent());
    f.keyword('at').append(Formatting.oneSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // from (1, 1) to (3, 3)
  private formatObstacleRect(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.node(node).prepend(Formatting.indent());
    f.keyword('from').append(Formatting.oneSpace());
    f.keywords('(').append(Formatting.noSpace());
    f.keywords(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keywords(')').prepend(Formatting.noSpace());
    f.keyword('to').surround(Formatting.oneSpace());
  }

  // dock at (0, 4)
  private formatWaypoint(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.node(node).prepend(Formatting.indent());
    f.property('name').append(Formatting.oneSpace());
    f.keyword('at').append(Formatting.oneSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // deliver :
  //   goTo(box)
  //   pickup(box)
  private formatTask(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.node(node).prepend(Formatting.indent());
    f.property('name').append(Formatting.oneSpace());
    f.properties('steps').prepend(Formatting.indent());
  }

  // goTo(box)  or  goTo(3, 2)
  private formatGoTo(node: AstNode): void {
    const f = this.getNodeFormatter(node);
    f.keyword('goTo').append(Formatting.noSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(',').prepend(Formatting.noSpace()).append(Formatting.oneSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // turn(left), pickup(box), load(shelf), unload(shelf), scan(obj)
  private formatParenCommand(node: AstNode, keyword: string): void {
    const f = this.getNodeFormatter(node);
    f.keyword(keyword).append(Formatting.noSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }

  // drop(), charge()
  private formatEmptyParenCommand(node: AstNode, keyword: string): void {
    const f = this.getNodeFormatter(node);
    f.keyword(keyword).append(Formatting.noSpace());
    f.keyword('(').append(Formatting.noSpace());
    f.keyword(')').prepend(Formatting.noSpace());
  }
}
