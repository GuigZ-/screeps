import {Hostiles, StorageType, UndertakerSource} from '../Constants';
import {isRepairable} from './RepairUtil';
import {RoomUtil} from './RoomUtil';

export const isBuildable = (pos: RoomPosition): boolean => {
  const structures: LookAtResult[] = pos.look();
  const lookAtResults: LookAtResult[] = structures
    .filter(e => {
              return e.terrain === 'plain' || e.terrain === 'swamp' || (e.structure && e.structure.structureType === 'road') || e.creep
            }
    );

  return lookAtResults.length === structures.length;
};

export class PositionUtil {
  public static closestSources(pos: RoomPosition, roomSearch: boolean = false): Source[] {
    let sources: Source[] = [];
    if (!Memory.sourcesList[pos.roomName]) {
      for (const key in Game.rooms) {
        const room: Room = Game.rooms[key];

        if (roomSearch && !RoomUtil.isNearestRoom(pos.roomName, room.name)) {
          continue;
        }

        const roomPosition: RoomPosition = new RoomPosition(25, 25, room.name);

        sources = sources.concat(roomPosition.findInRange(
          FIND_SOURCES,
          50,
          {filter: s => !roomSearch || s.room.name === roomPosition.roomName}
        ));
      }

      for (const source of sources) {
        if (!Memory.sourcesList[pos.roomName]) {
          Memory.sourcesList[pos.roomName] = [];
        }

        Memory.sourcesList[pos.roomName].push(source.id);
      }
    } else {
      for (const id of Memory.sourcesList[pos.roomName]) {
        const objectById = Game.getObjectById(id);

        if (objectById instanceof Source) {
          sources.push(objectById);
        }
      }
    }

    sources = sources.filter(s => s.energy > 0);

    return _.sortBy(sources, s => {
      const rangeTo = pos.getRangeTo(s);

      if (rangeTo !== Infinity) {
        return rangeTo;
      }

      if (!Memory.pathMemory) {
        Memory.pathMemory = [];
      }

      return this.findInMemory(pos, s.pos) + 50;
    });
  }

  private static findInMemory(pos: RoomPosition, s: RoomPosition): number {
    if (!Memory.pathMemory) {
      Memory.pathMemory = [];
    }

    for (const path of Memory.pathMemory) {
      if (pos.roomName !== path.from) {
        continue;
      }

      if (s.x !== path.to.x || s.y !== path.to.y || s.roomName !== path.to.roomName) {
        continue;
      }

      return path.path;
    }

    const pathTo: number = pos.findPathTo(s).length;

    Memory.pathMemory.push({from: pos.roomName, to: s, path: pathTo});

    return pathTo;
  }

  public static closestUndertakerSources(pos: RoomPosition): UndertakerSource[] {
    let sources: UndertakerSource[] = pos.findInRange(
      FIND_RUINS,
      50,
      {filter: s => s.store.getUsedCapacity() > 0}
    );

    sources = sources.concat(pos.findInRange(
      FIND_TOMBSTONES,
      50,
      {filter: s => s.store.getUsedCapacity() > 0}
    ));

    return _.sortBy(sources, s => pos.getRangeTo(s));
  }

  public static closestEnergyStorages(pos: RoomPosition, freeCapacity: boolean = false, roomSearch: boolean = false): StorageType[] {
    let storages: StorageType[] = [];
    if (!Memory.storagesList[pos.roomName]) {

      for (const key in Game.rooms) {
        const room: Room = Game.rooms[key];

        if (roomSearch && !RoomUtil.isNearestRoom(pos.roomName, room.name)) {
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
              s.structureType)
          }
        ));
      }

      for (const storage of storages) {
        if (!Memory.storagesList[pos.roomName]) {
          Memory.storagesList[pos.roomName] = [];
        }

        Memory.storagesList[pos.roomName].push(storage.id);
      }

    } else {
      for (const id of Memory.storagesList[pos.roomName]) {
        const objectById = Game.getObjectById(id);

        if (objectById instanceof StructureSpawn || objectById instanceof StructureExtension || objectById instanceof StructureTower) {
          storages.push(objectById);
        }
      }
    }

    storages = storages.filter(s => !freeCapacity || s.store.getFreeCapacity(RESOURCE_ENERGY) > 0);

    return _.sortBy(storages, s => {
      return pos.getRangeTo(s) * (s.structureType === STRUCTURE_TOWER ? 5 : 1);
    });
  }

  public static closestHostiles(pos: RoomPosition, range: number = 50): Hostiles[] {
    const room = Game.rooms[pos.roomName];

    if (!room) {
      return [];
    }

    let allHostiles: Hostiles[] = pos.findInRange(FIND_HOSTILE_CREEPS, range);

    // @ts-ignore
    allHostiles = allHostiles.concat(pos.findInRange(
      FIND_STRUCTURES,
      range,
      {filter: s => s.structureType === STRUCTURE_INVADER_CORE}
    ));

    return _.sortBy(
      allHostiles,
      s => {
        if (!Memory.invaders || Game.time % 500 === 0) {
          Memory.invaders = {};
        }

        const d: Date = new Date();
        const date: string = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

        const name: string = `${s.owner.username} - ${s instanceof Creep ? s.name : ''}`;
        Memory.invaders[name] = {name, date, pos: s.pos};

        return pos.getRangeTo(s);
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
    // const spawns = Game.rooms[pos.roomName].find(FIND_MY_SPAWNS);
    //
    // if (spawns && spawns[0].memory.creeps.filter(c => Game.creeps[c].memory.role === 'harvest').length < 4) {
    //   return [];
    // }

    let anyOwnedStructures: AnyStructure[] = Game.rooms[pos.roomName].find(FIND_MY_STRUCTURES, {
      filter: s => isRepairable(s)
    });

    anyOwnedStructures = anyOwnedStructures.concat(Game.rooms[pos.roomName].find(FIND_STRUCTURES, {
      filter: s => (s.structureType === STRUCTURE_RAMPART || s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_ROAD) && isRepairable(
        s)
    }));

    return _.sortBy(anyOwnedStructures, s => s.hits / s.hitsMax);
  }
}
