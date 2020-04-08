import {WorkInterface} from './WorkInterface';
import {CreepController} from '../Controller/CreepController';
import {PositionUtil} from '../Utils/PositionUtil';
import {StorageType} from '../Constants';

export class Transfer implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Transfer.can(creep)) {
      return false;
    }

    CreepController.resetMemory(creep);

    const storages: StorageType[] = this.getStorages(creep);

    for (const storage of storages) {
      if (storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        continue;
      }

      const transfer: ScreepsReturnCode = creep.transfer(storage, RESOURCE_ENERGY);
      if (transfer === ERR_NOT_IN_RANGE || transfer === OK) {
        if (transfer === ERR_NOT_IN_RANGE) {
          const moveTo: ScreepsReturnCode = creep.moveTo(storage);
          if (moveTo !== OK && moveTo !== ERR_TIRED) {
            continue;
          }
        }
        creep.memory.working = true;
        creep.memory.transfer = true;
        creep.memory.target = storage.id;

        return true;
      }
    }

    CreepController.resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.transfer) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private getStorages(creep: Creep): StorageType[] {
    let storages: StorageType[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);
      const isStorageType = target instanceof StructureSpawn || target instanceof StructureSpawn || target instanceof StructureSpawn;

      // @ts-ignore : target.store not exists for RoomObject
      if (isStorageType && target.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
        storages.push(<StorageType>target);
      }
    }

    return storages.concat(PositionUtil.closestStorages(creep.pos));
  }
}
