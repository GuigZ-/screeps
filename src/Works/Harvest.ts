import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {PositionUtil} from '../Utils/PositionUtil';
import {RoomUtil} from '../Utils/RoomUtil';
import {WorkInterface} from './WorkInterface';
import {CLAIMER, ROOM_BUILDER} from '../Constants';

export class Harvest implements WorkInterface {

  public work(creep: Creep): boolean {
    if (!Harvest.can(creep)) {

      return false;
    }

    resetMemory(creep);

    const sources: Source[] = Harvest.getSources(creep);

    for (const source of sources) {
      if (creep.memory.role !== CLAIMER && creep.memory.role !== ROOM_BUILDER && !RoomUtil.isNearestRoom(
        Game.spawns[creep.memory.spawnName].room.name,
        source.pos.roomName
      )) {
        continue;
      }

      const harvest: CreepActionReturnCode | ERR_NOT_FOUND | ERR_NOT_ENOUGH_RESOURCES = creep.harvest(source);

      if (workMoveTo(creep, harvest, source)) {
        creep.memory.harvest = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.harvest) {
      return false;
    }

    return creep.store.getFreeCapacity() !== 0;
  }

  private static getSources(creep: Creep): Source[] {
    const targets: Source[] = [];

    if (creep.memory.source) {
      const memorySource: Source | null = Game.getObjectById(creep.memory.source);

      if (memorySource instanceof Source && memorySource.energy > 0) {
        targets.push(memorySource);
      }
    }

    if (creep.memory.target) {
      const memoryTarget: RoomObject = Game.getObjectById(creep.memory.target);

      if (memoryTarget instanceof Source && memoryTarget.energy > 0) {
        targets.push(memoryTarget);
        return targets;
      }
    }

    return targets.concat(PositionUtil.closestSources(
      creep.pos,
      creep.memory.role !== CLAIMER && creep.memory.role !== ROOM_BUILDER
    ));
  }
}
