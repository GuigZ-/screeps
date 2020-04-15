import {Hostiles, StorageType, WORKS} from '../Constants';
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

  public static findCreepByType(work?: WORKS): Creep[] {
    const creeps: Creep[] = [];
    for (const key in Game.creeps) {
      const creep: Creep = Game.creeps[key];

      if (!work || creep.memory.role === work) {
        creeps.push(creep);
      }
    }

    return creeps;
  }

  public static findControllers(pos: RoomPosition): StructureController[] {
    let controllers: StructureController[] = [];
    for (const key in Game.rooms) {
      const room: Room = Game.rooms[key];
      const roomPosition: RoomPosition = new RoomPosition(25, 25, room.name);
      // @ts-ignore
      controllers = controllers.concat(roomPosition.findInRange(FIND_MY_STRUCTURES, 50, {
        filter: structure => structure.structureType === STRUCTURE_CONTROLLER
      }));
    }

    return _.sortBy(controllers, s => pos.getRangeTo(s));
  }

  public static closestResources(pos: RoomPosition): Resource[] {
    // @ts-ignore
    const resources: Resource[] = pos.findInRange(FIND_DROPPED_RESOURCES, 50, {
      filter: structure => structure.amount > 0
    });

    return _.sortBy(resources, s => pos.getRangeTo(s));
  }

  public static getFlags(pos: RoomPosition): Flag[] {
    const flags: Flag[] = [];

    if (Game.flags) {
      for (const key in Game.flags) {
        const flag: Flag = Game.flags[key];

        flags.push(flag);
      }
    }

    return _.sortBy(flags, f => pos.getRangeTo(f.pos));
  }

  public static getVisitorFlags(pos: RoomPosition): Flag[] {
    const flags: Flag[] = [];
    const allFlags: Flag[] = this.getFlags(pos);

    for (const flag of allFlags) {
      const visitorCreep: Creep | null = flag.memory.visitor ? Game.getObjectById(flag.memory.visitor) : null;

      if (!visitorCreep && flag.memory.visitor) {
        console.log(`Clear flag - ${flag.name} ${flag.pos}`);
        flag.memory.visitor = undefined;
      }


      if (flag.color !== COLOR_YELLOW || visitorCreep) {
        continue;
      }

      const hostiles: Hostiles[] = PositionUtil.closestHostiles(flag.pos);

      if (hostiles.length > 0) {
        continue;
      }

      flags.push(flag);
    }

    return flags;
  }

  public static getStorages(pos: RoomPosition): StructureStorage[] {
    // @ts-ignore
    return pos.findInRange(FIND_MY_STRUCTURES, 50, {
      filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getFreeCapacity(RESOURCE_ENERGY) !== 0
    });
  }
}
