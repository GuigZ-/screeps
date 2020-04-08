import {WorkInterface} from './WorkInterface';
import {CreepController} from '../Controller/CreepController';
import {PositionUtil} from '../Utils/PositionUtil';
import {StorageType} from '../Constants';
import {Finder} from '../Utils/Finder';

export class Upgrade implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Upgrade.can(creep)) {
      return false;
    }

    CreepController.resetMemory(creep);

    const controllers: StructureController[] = this.getControllers(creep);

    for (const controller of controllers) {
      const upgrader: ScreepsReturnCode = creep.upgradeController(controller);

      if (upgrader === ERR_NOT_IN_RANGE || upgrader === OK) {
        if (upgrader === ERR_NOT_IN_RANGE) {
          const moveTo: ScreepsReturnCode = creep.moveTo(controller);
          if (moveTo !== OK && moveTo !== ERR_TIRED) {
            continue;
          }
        }
        creep.memory.working = true;
        creep.memory.upgrade = true;
        creep.memory.target = controller.id;
        return true;
      }
    }

    CreepController.resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.upgrade) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private getControllers(creep: Creep): StructureController[] {
    let storages: StructureController[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof StructureController && target.my) {
        storages.push(target);
      }
    }

    return storages.concat(Finder.findControllers(creep.pos));
  }
}
