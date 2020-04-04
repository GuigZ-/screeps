export class PositionUtil {
  public static closestSources(pos: RoomPosition, roomSearch: boolean = false): Source[] {
    const allSources: Source[] = pos.findInRange(
      FIND_SOURCES,
      50,
      {filter: s => !roomSearch || s.room.name === pos.roomName}
    );
    return _.sortBy(allSources, s => pos.getRangeTo(s));
  }

  public static closestStorages(pos: RoomPosition, freeCapacity: boolean = false): (StructureSpawn | StructureExtension | StructureTower)[] {
    // @ts-ignore
    const allStorages: (StructureSpawn | StructureExtension | StructureTower)[] = pos.findInRange(
      FIND_MY_STRUCTURES,
      50,
      {
        filter: s => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER].includes(
          // @ts-ignore
          s.structureType) && (!freeCapacity || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
      }
    );

    return _.sortBy(allStorages, s => pos.getRangeTo(s));
  }

  public static closestHostiles(pos: RoomPosition): (Creep | StructureInvaderCore)[] {
    let allHostiles: (Creep | StructureInvaderCore)[] = Game.rooms[pos.roomName].find(FIND_HOSTILE_CREEPS);

    // @ts-ignore
    allHostiles = allHostiles.concat(Game.rooms[pos.roomName].find(FIND_STRUCTURES, {filter: s => s.structureType === STRUCTURE_INVADER_CORE}));

    return _.sortBy(allHostiles, s => pos.getRangeTo(s));
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
    const rate: number = 0.2;
    let anyOwnedStructures: AnyStructure[] = Game.rooms[pos.roomName].find(FIND_MY_STRUCTURES, {
      filter: s => s.hitsMax * rate > s.hits
    });

    anyOwnedStructures = anyOwnedStructures.concat(Game.rooms[pos.roomName].find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL) && (s.hitsMax * rate) > s.hits
    }));

    return _.sortBy(anyOwnedStructures, s => s.hits / s.hitsMax);
  }
}
