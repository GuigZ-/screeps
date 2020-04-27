import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {RoomUtil} from '../Utils/RoomUtil';
import {WorkInterface} from './WorkInterface';
import {Finder} from '../Utils/Finder';

export class TransferStorage implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!TransferStorage.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const storages: StructureStorage[] = this.getStorages(creep);

    for (const storage of storages) {
      for (const energy of Object.keys(creep.store)) {
        if (energy === RESOURCE_ENERGY) {
          continue;
        }

        if (storage.store.getFreeCapacity(<ResourceConstant>energy) === 0) {
          continue;
        }

        const transfer: ScreepsReturnCode = creep.transfer(storage, <ResourceConstant>energy);
        if (workMoveTo(creep, transfer, storage)) {
          creep.memory.transferStorage = true;
          return true;
        }
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.transferStorage) {
      return false;
    }

    return creep.store.getCapacity() !== creep.store.getFreeCapacity();
  }

  private getStorages(creep: Creep): StructureStorage[] {
    const storages: StructureStorage[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);
      const isStorageType = target instanceof StructureStorage;

      // @ts-ignore : target.store not exists for RoomObject
      if (isStorageType) {
        storages.push(<StructureStorage>target);
      }
    }

    return storages.concat(Finder.getStorages(creep.pos));
  }
}
