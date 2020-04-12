import {Hostiles, KILLER} from '../Constants';
import {moveTo, resetMemory} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {PositionUtil} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';

export class Visitor implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Visitor.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const flags: Flag[] = Finder.getFlags(creep);

    for (const flag of flags) {
      if (flag.color !== COLOR_YELLOW) {
        continue;
      }
      
      const hostiles: Hostiles[] = PositionUtil.closestHostiles(flag.pos);

      if (hostiles.length > 0) {
        continue;
      }

      if (moveTo(creep, flag)) {
        creep.memory.visitorFlag = flag.name;
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

    return !(creep.memory.working && !creep.memory.visitorFlag);
  }
}
