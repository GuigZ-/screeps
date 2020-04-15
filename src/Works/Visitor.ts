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

    const flags: Flag[] = Visitor.getFlags(creep);

    for (const flag of flags) {
      if (moveTo(creep, flag)) {
        creep.memory.visitorFlag = flag.name;
        flag.memory.visitor = creep.id;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (this.getFlags(creep).length === 0 && !creep.memory.visitorFlag) {
      return false;
    }

    return !(creep.memory.working && !creep.memory.visitorFlag);
  }

  private static getFlags(creep: Creep): Flag[] {
    const flags: Flag[] = [];

    if (creep.memory.visitorFlag && Object.keys(Game.flags)
                                   .includes(creep.memory.visitorFlag)) {
      const target: RoomObject = Game.flags[creep.memory.visitorFlag];

      if (target instanceof Flag) {
        flags.push(target);

        return flags;
      }
    }

    return flags.concat(Finder.getVisitorFlags(creep.pos));
  }
}
