import {WorkInterface} from './WorkInterface';
import {CreepController} from '../Controller/CreepController';

export class Build implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Build.can(creep)) {
      return false;
    }

    CreepController.resetMemory(creep);

    const constructionSites: ConstructionSite[] = Build.getConstructionSites(creep);

    for (const constructionSite of constructionSites) {
      const build: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH = creep.build(constructionSite);

      if (build === ERR_NOT_IN_RANGE || build === OK) {
        if (build === ERR_NOT_IN_RANGE) {
          const moveTo: ScreepsReturnCode = creep.moveTo(constructionSite);
          if (moveTo !== OK && moveTo !== ERR_TIRED) {
            continue;
          }
        }
        creep.memory.working = true;
        creep.memory.build = true;
        creep.memory.target = constructionSite.id;
        return true;
      }
    }

    CreepController.resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.build) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private static getConstructionSites(creep: Creep): ConstructionSite[] {
    let constructionSites: ConstructionSite[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof ConstructionSite && target.my) {
        constructionSites.push(target);
      }
    }

    const sortByTypes: BuildableStructureConstant[] = [STRUCTURE_SPAWN, STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_WALL, STRUCTURE_ROAD, STRUCTURE_RAMPART];

    for (const type of sortByTypes) {
      const targets = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
        filter: e => e.room && e.room.name === creep.room.name && e.structureType === type
      });

      if (targets) {
        constructionSites = constructionSites.concat(targets);
      }
    }

    return constructionSites;
  }
}
