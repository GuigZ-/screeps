import {Hostiles, KILLER} from '../Constants';
import {moveTo, resetMemory} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {PositionUtil} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';

export class ToFlag implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!ToFlag.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const flags: Flag[] = Finder.getFlags(creep.pos);

    for (const flag of flags) {
      const hostiles: Hostiles[] = PositionUtil.closestHostiles(flag.pos);

      if (hostiles.length > 0 && creep.memory.role !== KILLER) {
        continue;
      }

      if (hostiles.length === 0 && creep.memory.role === KILLER) {
        continue;
      }

      if (flag.room && creep.room.name === flag.room.name) {
        continue;
      }

      if (moveTo(creep, flag)) {
        creep.memory.flag = flag.name;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (!Game.flags) {
      return false;
    }

    return !(creep.memory.working && !creep.memory.flag);
  }
}
