import {WORKS} from '../Constants';
import {PositionUtil} from './PositionUtil';

export class Finder {
  public static findRoomsToBuild(): Room[] {
    const rooms: Room[] = [];

    for (const k in Game.rooms) {
      const room: Room = Game.rooms[k];

      if (!room) {
        continue;
      }

      if (room.controller && !room.controller.my) {
        continue;
      }

      if (room.find(FIND_MY_CONSTRUCTION_SITES, {filter: s => s.structureType === STRUCTURE_SPAWN}).length === 0) {
        continue;
      }

      rooms.push(room);
    }

    return rooms;
  }

  public static findOwnRooms(): Room[] {
    const rooms: Room[] = [];

    for (const key in Game.rooms) {
      const room: Room = Game.rooms[key];
      if (room.controller && room.controller.my) {
        rooms.push(room);
      }
    }

    return rooms;
  }

  public static findCreepByType(work: WORKS | undefined = undefined): Creep[] {
    const creeps: Creep[] = [];
    for (const key in Game.creeps) {
      const creep: Creep = Game.creeps[key];

      if (!work || creep.memory.role === work) {
        creeps.push(creep);
      }
    }

    return creeps;
  }

  public static findProtectedRoom(): Room[] {
    const rooms: Room[] = [];
    if (!Game.flags) {
      return rooms;
    }

    for (const key in Game.flags) {
      const flag: Flag = Game.flags[key];

      if (!flag) {
        continue;
      }

      if (PositionUtil.closestHostiles(flag.pos).length === 0) {
        continue;
      }

      if (flag.room) {
        rooms.push(flag.room);
      }
    }

    return rooms;
  }

  public static findControllers(pos: RoomPosition): StructureController[] {
    // @ts-ignore
    const controllers: StructureController[] = pos.findInRange(FIND_MY_STRUCTURES, 50, {
      filter: structure => structure.structureType === STRUCTURE_CONTROLLER
    });

    return  _.sortBy(controllers, s => pos.getRangeTo(s));
  }
}
