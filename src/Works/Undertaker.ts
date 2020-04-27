import {UndertakerSource} from '../Constants';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {PositionUtil} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';

export class Undertaker implements WorkInterface {

  public work(creep: Creep): boolean {
    if (!Undertaker.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const sources: UndertakerSource[] = Undertaker.getSources(creep);

    for (const source of sources) {
      for (const energy of Object.keys(source.store)) {
        const withdraw: ScreepsReturnCode = creep.withdraw(source, <ResourceConstant>energy);

        if (workMoveTo(creep, withdraw, source)) {
          creep.memory.undertaker = true;
          return true;
        }
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.undertaker && !creep.memory.harvest) {
      return false;
    }

    return creep.store.getFreeCapacity() !== 0;
  }

  private static getSources(creep: Creep): UndertakerSource[] {
    const targets: UndertakerSource[] = [];

    if (creep.memory.target) {
      const memoryTarget: RoomObject = Game.getObjectById(creep.memory.target);

      if ((memoryTarget instanceof Ruin || memoryTarget instanceof Tombstone) && memoryTarget.store.getFreeCapacity() > 0) {
        targets.push(memoryTarget);
      }
    }

    return targets.concat(PositionUtil.closestUndertakerSources(creep.pos));
  }
}
