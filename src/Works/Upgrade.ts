import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {RoomUtil} from '../Utils/RoomUtil';
import {WorkInterface} from './WorkInterface';

export class Upgrade implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Upgrade.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const controllers: StructureController[] = this.getControllers(creep);

    for (const controller of controllers) {
      if (!RoomUtil.isNearestRoom(Game.spawns[creep.memory.spawnName].room.name, controller.pos.roomName)) {
        continue;
      }

      const upgrader: ScreepsReturnCode = creep.upgradeController(controller);

      if (workMoveTo(creep, upgrader, controller)) {
        creep.memory.upgrade = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.upgrade) {
      return false;
    }

    return creep.store.getCapacity() !== creep.store.getFreeCapacity();
  }

  private getControllers(creep: Creep): StructureController[] {
    const storages: StructureController[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof StructureController && target.my) {
        storages.push(target);
      }
    }

    return storages.concat(Finder.findControllers(creep.pos));
  }
}
