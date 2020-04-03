export class PositionUtil {
  public static closestSources(pos: RoomPosition, roomSearch: boolean = false): Source[] {
    const allSources: Source[] = pos.findInRange(FIND_SOURCES, 50, {filter: s => !roomSearch || s.room.name === pos.roomName});
    return  _.sortBy(allSources, s => pos.getRangeTo(s));
  }

  public static closestStorages(pos: RoomPosition,freeCapacity : boolean = false): (StructureSpawn | StructureExtension | StructureTower)[] {
    // @ts-ignore
    const allStorages: (StructureSpawn | StructureExtension | StructureTower)[] = pos.findInRange(FIND_MY_STRUCTURES, 50, {
      filter: s => [STRUCTURE_EXTENSION, STRUCTURE_SPAWN, STRUCTURE_TOWER].includes(
        // @ts-ignore
        s.structureType) && (!freeCapacity || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
    });

    return  _.sortBy(allStorages, s => pos.getRangeTo(s));
  }

  public static closestHostileCreeps(pos: RoomPosition): Creep[] {
    const allCreeps: Creep[] = Game.rooms[pos.roomName].find(FIND_HOSTILE_CREEPS);

    return _.sortBy(allCreeps, s => pos.getRangeTo(s));
  }

  public static pathRoad(from: RoomPosition, to: RoomPosition, range: number = 1): PathFinderPath {
    const room: Room = Game.rooms[from.roomName];

    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        const costs = new PathFinder.CostMatrix;

        room.find(FIND_MY_STRUCTURES).forEach((struct: Structure) => {
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

  static closestStructureToRepair(pos: RoomPosition) : AnyStructure[] {
    let anyOwnedStructures: AnyStructure[] = Game.rooms[pos.roomName].find(FIND_MY_STRUCTURES, {
      filter: s => s.hitsMax * 0.1 > s.hits
    });

    anyOwnedStructures.concat(Game.rooms[pos.roomName].find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_WALL) && console.log(`${JSON.stringify(s)}`) &&  s.hitsMax * 0.1 > s.hits
    }));

    return _.sortBy(anyOwnedStructures, s => pos.getRangeTo(s));
  }
}
