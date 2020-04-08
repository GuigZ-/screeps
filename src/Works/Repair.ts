import {WorkInterface} from './WorkInterface';
import {CreepController} from '../Controller/CreepController';
import {PositionUtil} from '../Utils/PositionUtil';

export class Repair implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Repair.can(creep)) {
      return false;
    }

    CreepController.resetMemory(creep);

    const structures: Structure[] = Repair.getStructures(creep);

    for (const structure of structures) {
      const repair: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES = creep.repair(structure);

      if (repair === ERR_NOT_IN_RANGE || repair === OK) {
        if (repair === ERR_NOT_IN_RANGE) {
          const moveTo: ScreepsReturnCode = creep.moveTo(structure);
          if (moveTo !== OK && moveTo !== ERR_TIRED) {
            continue;
          }
        }
        creep.memory.working = true;
        creep.memory.repair = true;
        creep.memory.target = structure.id;
        return true;
      }
    }

    CreepController.resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.repair) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private static getStructures(creep: Creep): Structure[] {
    let constructionSites: Structure[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof Structure) {
        constructionSites.push(target);
      }
    }

    return constructionSites.concat(PositionUtil.closestStructureToRepair(creep.pos));
  }
}
