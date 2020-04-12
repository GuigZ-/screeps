import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {WorkInterface} from './WorkInterface';

export class Pickup implements WorkInterface {

  public work(creep: Creep): boolean {
    if (!Pickup.can(creep)) {
      resetMemory(creep);

      return false;
    }

    resetMemory(creep);

    const sources: Resource[] = Pickup.getSources(creep);
    for (const source of sources) {
      const withdraw: ScreepsReturnCode = creep.pickup(source);

      if (workMoveTo(creep, withdraw, source)) {
        creep.memory.resource = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    return !(creep.memory.working && !creep.memory.resource && !creep.memory.harvest);
  }

  private static getSources(creep: Creep): Resource[] {
    const targets: Resource[] = [];

    if (creep.memory.target) {
      const memoryTarget: RoomObject = Game.getObjectById(creep.memory.target);

      if (memoryTarget instanceof Resource && memoryTarget.amount > 0) {
        targets.push(memoryTarget);
      }
    }

    return targets.concat(Finder.closestResources(creep.pos));
  }
}
