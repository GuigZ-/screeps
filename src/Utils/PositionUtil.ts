import {Hostiles, StorageType, UndertakerSource} from '../Constants';
import {isRepairable} from './RepairUtil';
import {RoomUtil} from './RoomUtil';

export class PositionUtil {
  public static closestSources(pos: RoomPosition, roomSearch: boolean = false): Source[] {
    let sources: Source[] = [];

    for (const key in Game.rooms) {
      const room: Room = Game.rooms[key];

      if (!RoomUtil.isNearestRoom(pos.roomName, room.name)) {
        continue;
      }

      if (roomSearch && room.name !== pos.roomName) {
        continue;
      }

      const roomPosition: RoomPosition = new RoomPosition(25, 25, room.name);

      sources = sources.concat(roomPosition.findInRange(
        FIND_SOURCES,
        50,
        {filter: s => s.energy > 0 && (!roomSearch || s.room.name === roomPosition.roomName)}
      ));
    }

    return _.sortBy(sources, s => pos.getRangeTo(s));
  }

  public static closestUndertakerSources(pos: RoomPosition): UndertakerSource[] {
    let sources: UndertakerSource[] = pos.findInRange(
      FIND_RUINS,
      50,
      {filter: s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0}
    );

    sources = sources.concat(pos.findInRange(
      FIND_TOMBSTONES,
      50,
      {filter: s => s.store.getUsedCapacity(RESOURCE_ENERGY) > 0}
    ));

    sources = sources.concat(<StructureStorage[]>pos.findInRange(
      FIND_MY_STRUCTURES,
      50,
      {filter: s => s.structureType === STRUCTURE_STORAGE && s.store.getUsedCapacity(RESOURCE_ENERGY) > 0}
    ));

    return _.sortBy(sources, s => pos.getRangeTo(s));
  }

  public static closestEnergyStorages(pos: RoomPosition, freeCapacity: boolean = false): StorageType[] {
    let storages: StorageType[] = [];
    for (const key in Game.rooms) {
      const room: Room = Game.rooms[key];

      if (!RoomUtil.isNearestRoom(pos.roomName, room.name)) {
        continue;
      }

      const roomPosition: RoomPosition = new RoomPosition(25, 25, room.name);
      // @ts-ignore
      storages = storages.concat(roomPosition.findInRange(
        FIND_MY_STRUCTURES,
        50,
        {
          filter: s => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER].includes(
            // @ts-ignore
            s.structureType) && (!freeCapacity || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
        }
      ));
    }

    return _.sortBy(storages, s => pos.getRangeTo(s));
  }

  public static closestHostiles(pos: RoomPosition): Hostiles[] {
    const room = Game.rooms[pos.roomName];

    if (!room) {
      return [];
    }

    let allHostiles: Hostiles[] = room.find(FIND_HOSTILE_CREEPS);

    // @ts-ignore
    allHostiles = allHostiles.concat(room.find(
      FIND_STRUCTURES,
      {filter: s => s.structureType === STRUCTURE_INVADER_CORE}
    ));

    return _.sortBy(
      allHostiles,
      s => {
        if (s instanceof Creep) {
          return s.getActiveBodyparts(HEAL) * -5 + s.getActiveBodyparts(ATTACK) * -1;
        }

        return 50 * pos.getRangeTo(s);
      }
    );
  }

  public static pathRoad(from: RoomPosition, to: RoomPosition, range: number = 1): PathFinderPath {
    const room: Room = Game.rooms[from.roomName];

    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        const costs = new PathFinder.CostMatrix;

        room.find(FIND_MY_STRUCTURES)
            .forEach((struct: Structure) => {
              if (struct.structureType === STRUCTURE_CONTAINER ||
                (struct.structureType === STRUCTURE_RAMPART &&
                  !(struct instanceof OwnedStructure))) {
                costs.set(struct.pos.x, struct.pos.y, 0xff);
              }
            });

        return costs;
      }
    };

    return PathFinder.search(
      from, {pos: to, range}, opts
    );
  }

  static closestStructureToRepair(pos: RoomPosition): AnyStructure[] {
    let anyOwnedStructures: AnyStructure[] = Game.rooms[pos.roomName].find(FIND_MY_STRUCTURES, {
      filter: s => isRepairable(s)
    });

    anyOwnedStructures = anyOwnedStructures.concat(Game.rooms[pos.roomName].find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD) && isRepairable(s)
    }));

    return _.sortBy(anyOwnedStructures, s => s.hits / s.hitsMax);
  }
}
