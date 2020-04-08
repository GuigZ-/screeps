import {WorkInterface} from './WorkInterface';
import {CreepController} from '../Controller/CreepController';
import {PositionUtil} from '../Utils/PositionUtil';
import {Hostiles} from '../Constants';

export class Attack implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Attack.can(creep)) {
      return false;
    }

    CreepController.resetMemory(creep);

    const hostiles: Hostiles[] = Attack.getHostiles(creep);

    for (const hostile of hostiles) {
      const attack: CreepActionReturnCode = creep.attack(hostile);

      if (attack === ERR_NOT_IN_RANGE || attack === OK) {
        if (attack === ERR_NOT_IN_RANGE) {
          const moveTo: ScreepsReturnCode = creep.moveTo(hostile);
          if (moveTo !== OK && moveTo !== ERR_TIRED) {
            continue;
          }
        }
        creep.memory.working = true;
        creep.memory.attack = true;
        creep.memory.target = hostile.id;
        return true;
      }
    }

    CreepController.resetMemory(creep);

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
