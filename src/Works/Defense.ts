import {Hostiles, KILLER} from '../Constants';
import {moveTo, resetMemory} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {PositionUtil} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';

export class Defense implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Defense.can(creep)) {
      return false;
    }

    moveTo(creep, Game.spawns[creep.memory.spawnName]);

    return true;
  }

  private static can(creep: Creep): boolean {
    return PositionUtil.closestHostiles(creep.pos).length > 0;
  }
}
