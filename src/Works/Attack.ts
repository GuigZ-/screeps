import {WorkInterface} from './WorkInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {Hostiles} from '../Constants';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';

export class Attack implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Attack.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const hostiles: Hostiles[] = Attack.getHostiles(creep);

    for (const hostile of hostiles) {
      const attack: CreepActionReturnCode = creep.attack(hostile);

      if (workMoveTo(creep, attack, hostile)) {
        creep.memory.attack = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.attack) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private static getHostiles(creep: Creep): Hostiles[] {
    let hostiles: Hostiles[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof Creep && !target.my) {
        hostiles.push(target);
      }
    }

    return hostiles.concat(PositionUtil.closestHostiles(creep.pos));
  }
}
