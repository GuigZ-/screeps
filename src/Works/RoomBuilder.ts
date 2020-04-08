import {WorkInterface} from './WorkInterface';
import {Finder} from '../Utils/Finder';
import {moveTo, resetMemory} from '../Utils/CreepUtil';

export class RoomBuilder implements WorkInterface {
  work(creep: Creep): boolean {
    if (!RoomBuilder.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const rooms: Room[] = RoomBuilder.getRooms(creep);

    for (const room of rooms) {
      if (!room.controller) {
        continue;
      }

      if (moveTo(creep, room.controller, {visualizePathStyle: {lineStyle: undefined, stroke: '#00F', opacity: 1}})) {
        creep.memory.working = true;
        creep.memory.room = room.name;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.room) {
      return false;
    }

    return creep.store.getCapacity(RESOURCE_ENERGY) !== creep.store.getFreeCapacity(RESOURCE_ENERGY);
  }

  private static getRooms(creep: Creep): Room[] {
    let rooms: Room[] = [];

    if (creep.memory.room) {
      const target: Room | undefined = Game.rooms[creep.memory.room];

      if (target instanceof Room && target.controller && !target.controller.my) {
        rooms.push(target);
      }
    }

    rooms = rooms.concat(Finder.findRoomsToBuild());

    // @ts-ignore
    return _.sortBy(rooms, s => creep.pos.getRangeTo(s.controller.pos));
  }
}
