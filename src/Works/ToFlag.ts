import {WorkInterface} from './WorkInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {KILLER} from '../Constants';
import {moveTo, resetMemory} from '../Utils/CreepUtil';

export class ToFlag implements WorkInterface {
  work(creep: Creep): boolean {
    if (!ToFlag.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const flags: Flag[] = ToFlag.getFlags(creep);

    for (const flag of flags) {
      if (PositionUtil.closestHostiles(flag.pos).length > 0 && creep.memory.role !== KILLER) {
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

  private static getFlags(creep: Creep): Flag[] {
    let flags: Flag[] = [];

    if (creep.memory.flag && Object.keys(Game.flags)
                                   .includes(creep.memory.flag)) {
      const target: RoomObject = Game.flags[creep.memory.flag];

      if (target instanceof Flag) {
        flags.push(target);
      }
    }

    if (Game.flags) {
      for (const key in Game.flags) {
        const flag: Flag = Game.flags[key];

        flags.push(flag);
      }
    }

    return _.sortBy(flags, f => creep.pos.getRangeTo(f.pos));
  }
}
