import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {WorkInterface} from './WorkInterface';
import {PICKUP} from '../Constants';
import {Finder} from '../Utils/Finder';

export class Build implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Build.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const constructionSites: ConstructionSite[] = Build.getConstructionSites(creep);

    for (const constructionSite of constructionSites) {
      const build: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH = creep.build(constructionSite);


      if (workMoveTo(creep, build, constructionSite)) {
        creep.memory.build = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.build) {
      return false;
    }

    return creep.store.getCapacity() !== creep.store.getFreeCapacity();
  }

  private static getConstructionSites(creep: Creep): ConstructionSite[] {
    let constructionSites: ConstructionSite[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof ConstructionSite && target.my) {
        constructionSites.push(target);
      }
    }

    return constructionSites.concat(Finder.getConstructionSites(creep.pos));
  }
}
