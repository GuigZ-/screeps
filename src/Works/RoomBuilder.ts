import {moveTo, resetMemory} from '../Utils/CreepUtil';
import {Finder} from '../Utils/Finder';
import {WorkInterface} from './WorkInterface';

export class RoomBuilder implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!RoomBuilder.can(creep)) {
      return false;
    }

    resetMemory(creep);

    const rooms: Room[] = RoomBuilder.getRooms(creep);

    for (const room of rooms) {
      if (!room.controller || !room.controller.my || room.name === creep.pos.roomName) {
        continue;
      }

      const constructionsSites = room.find(FIND_MY_CONSTRUCTION_SITES, {filter: c => c.structureType === STRUCTURE_SPAWN});

      if (constructionsSites.length === 0) {
        continue;
      }

      if (moveTo(creep, constructionsSites[0], {visualizePathStyle: {lineStyle: undefined, stroke: '#00F', opacity: 1}})) {
        creep.memory.working = true;
        creep.memory.room = room.name;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    return !(creep.memory.working && !creep.memory.room);
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
