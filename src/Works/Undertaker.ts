import {WorkInterface} from './WorkInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {UndertakerSource} from '../Constants';

export class Undertaker implements WorkInterface {

  work(creep: Creep): boolean {
    if (!Undertaker.can(creep)) {
      resetMemory(creep);

      return false;
    }

    resetMemory(creep);

    const sources: UndertakerSource[] = Undertaker.getSources(creep);
console.log(`${creep.name} - undertaker - ${sources.length}`)
    for (const source of sources) {
      const withdraw: ScreepsReturnCode = creep.withdraw(source, RESOURCE_ENERGY);

      if (workMoveTo(creep, withdraw, source)) {
        creep.memory.undertaker = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.undertaker) {
      return false;
    }

    return creep.store.getFreeCapacity(RESOURCE_ENERGY) !== 0;
  }

  private static getSources(creep: Creep): UndertakerSource[] {
    let targets: UndertakerSource[] = [];

    if (creep.memory.target) {
      const memoryTarget: RoomObject = Game.getObjectById(creep.memory.target);

      if ((memoryTarget instanceof Ruin ||  memoryTarget instanceof Tombstone) && memoryTarget.store.getFreeCapacity() > 0) {
        targets.push(memoryTarget);
      }
    }

    return targets.concat(PositionUtil.closestUndertakerSources(creep.pos));
  }
}
