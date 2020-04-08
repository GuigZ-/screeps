import {WorkInterface} from './WorkInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {StorageType} from '../Constants';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';

export class Transfer implements WorkInterface {
  work(creep: Creep): boolean {
    if (!Transfer.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const storages: StorageType[] = this.getStorages(creep);

    for (const storage of storages) {
      if (storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        continue;
      }

      const transfer: ScreepsReturnCode = creep.transfer(storage, RESOURCE_ENERGY);
      if (workMoveTo(creep, transfer, storage)) {
        creep.memory.transfer = true;
        return true;
      }
    }

    resetMemory(creep);

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
