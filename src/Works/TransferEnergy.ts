import {StorageType} from '../Constants';
import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {PositionUtil} from '../Utils/PositionUtil';
import {RoomUtil} from '../Utils/RoomUtil';
import {WorkInterface} from './WorkInterface';

export class TransferEnergy implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!TransferEnergy.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const storages: StorageType[] = this.getEnergyStorages(creep);

    for (const storage of storages) {
      if (storage.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        continue;
      }

      if (!RoomUtil.isNearestRoom(Game.spawns[creep.memory.spawnName].room.name, storage.pos.roomName)) {
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

    return creep.store.getCapacity() !== creep.store.getFreeCapacity();
  }

  private getEnergyStorages(creep: Creep): StorageType[] {
    const storages: StorageType[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);
      const isStorageType = target instanceof StructureSpawn || target instanceof StructureSpawn || target instanceof StructureSpawn;

      // @ts-ignore : target.store not exists for RoomObject
      if (isStorageType && target.store.getFreeCapacity() > 0) {
        storages.push(target as StorageType);
      }
    }

    return storages.concat(PositionUtil.closestEnergyStorages(creep.pos));
  }
}
