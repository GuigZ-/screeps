import {Hostiles} from '../Constants';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {PositionUtil} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';

export class Attack implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Attack.can(creep)) {
      if (creep.memory.attack) {
        resetMemory(creep);
      }
      return false;
    }

    resetMemory(creep);

    creep.heal(creep);

    const hostiles: Hostiles[] = Attack.getHostiles(creep);

    for (const hostile of hostiles) {
      const attack: CreepActionReturnCode = creep.rangedAttack(hostile);

      if (workMoveTo(creep, attack, hostile)) {
        creep.memory.attack = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    const length = Attack.getHostiles(creep).length;

    return length > 0;
  }

  private static getHostiles(creep: Creep): Hostiles[] {
    const hostiles: Hostiles[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof Creep && !target.my) {
        hostiles.push(target);
      }
    }

    return hostiles.concat(PositionUtil.closestHostiles(creep.pos, 100));
  }
}
