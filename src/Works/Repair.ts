import {WorkInterface} from './WorkInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {isRepairable} from '../Utils/RepairUtil';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';

export class Repair implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Repair.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const structures: Structure[] = Repair.getStructures(creep);

    for (const structure of structures) {
      const repair: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES = creep.repair(structure);

      if (workMoveTo(creep, repair, structure)) {
        creep.memory.repair = true;
        return true;
      }
    }

    resetMemory(creep);

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

      if (target instanceof Structure && isRepairable(target)) {
        constructionSites.push(target);
      }
    }

    return constructionSites.concat(PositionUtil.closestStructureToRepair(creep.pos));
  }
}
