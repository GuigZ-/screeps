import {
  BUILDER,
  CLAIMER,
  HARVESTER,
  KILLER, MAPPER, PICKUP,
  REPAIRER,
  ROOM_BUILDER,
  StorageType,
  UNDERTAKER,
  UPGRADER, VISITOR, WORKS
} from '../Constants';
import {CreepCreator} from '../CreepCreator';
import {Finder} from '../Utils/Finder';
import {isBuildable, PositionUtil} from '../Utils/PositionUtil';
import {ControllerInterface} from './ControllerInterface';

export class SpawnController implements ControllerInterface {
  public static forceReload: boolean = false;
  private readonly spawnName: string;

  constructor(spawnName: string) {
    this.spawnName = spawnName;
  }

  public loop(): void {
    const spawn: StructureSpawn = Game.spawns[this.spawnName];

    if (!spawn || !spawn.my) {
      return;
    }

    if (spawn.memory.creeps) {
      const creepNames: string[] = [];

      spawn.memory.creeps.forEach(c => {
        if (Game.creeps[c]) {
          creepNames.push(c);
        }
      });

      spawn.memory.creeps = creepNames;
    }

    if (spawn.spawning && spawn.spawning.remainingTime <= 1) {
      SpawnController.forceReload = true;
    } else if (!spawn.spawning) {
      this.manageCreep(spawn);
    }

    if (Game.time % 100 === 75) {
      this.buildStorage(spawn);
    } else if (Game.time % 100 === 50) {
      this.buildExtensions(spawn);
    } else if (Game.time % 100 === 25) {
      this.buildRoad(spawn);
    } else if (Game.time % 100 === 0) {
      this.buildTower(spawn);
    }
  }

  private manageCreep(spawn: StructureSpawn): void {
    const room: Room = spawn.room;
    const creepNumberByType: any = {};

    if (spawn.memory.creeps) {
      spawn.memory.creeps.forEach(c => {
        const creep: Creep = Game.creeps[c];

        if (!creep) {
          return;
        }

        if (!creepNumberByType[creep.memory.role]) {
          creepNumberByType[creep.memory.role] = 0;
        }

        creepNumberByType[creep.memory.role]++;
      });
    }

    if (PositionUtil.closestHostiles(spawn.pos).length >= parseInt(creepNumberByType[KILLER])) {
      CreepCreator.build(spawn, KILLER);
    }

    const sourcesNumber: number = PositionUtil.closestSources(spawn.pos, true)
                                              .filter(s => s.pos.roomName === spawn.pos.roomName).length;
    const controllerNumber: number = room.find(
      FIND_STRUCTURES,
      {filter: s => s.room.name === room.name && s.structureType === STRUCTURE_CONTROLLER}
    ).length;

    if (!creepNumberByType[HARVESTER] || creepNumberByType[HARVESTER] < sourcesNumber * Math.min(
      2,
      room.controller ? room.controller.level : 1
    )) {
      CreepCreator.build(spawn, HARVESTER);
    }

    if (!creepNumberByType[MAPPER]) {
      CreepCreator.build(spawn, MAPPER);
    }

    if (spawn.room.energyAvailable < spawn.room.energyCapacityAvailable * 0.5) {
      return;
    }

    const undertakerSourcesLength: number = PositionUtil.closestUndertakerSources(spawn.pos).length;
    const closestResourcesLength: number = Finder.closestResources(spawn.pos).length;
    const structureToRepair: number = PositionUtil.closestStructureToRepair(spawn.pos).length;
    const constructionSites: number = Finder.getConstructionSites(spawn.pos).length;

    const rooms: Room[] = Finder.findRoomsToBuild();
    if (!creepNumberByType[UPGRADER] || creepNumberByType[UPGRADER] < controllerNumber * 2) {
      CreepCreator.build(spawn, UPGRADER);
    } else if (!creepNumberByType[BUILDER] && constructionSites) {
      CreepCreator.build(spawn, BUILDER);
    } else if (!creepNumberByType[KILLER] || creepNumberByType[KILLER] < Game.gcl) {
      CreepCreator.build(spawn, KILLER);
    } else if (!creepNumberByType[REPAIRER] && structureToRepair) {
      CreepCreator.build(spawn, REPAIRER);
    } else if (rooms.length) {
      // @ts-ignore
      CreepCreator.build(spawn, ROOM_BUILDER, {memory: {room: rooms[0].name}});
    } else if ((!creepNumberByType[UNDERTAKER] && undertakerSourcesLength) || undertakerSourcesLength > creepNumberByType[UNDERTAKER]) {
      CreepCreator.build(spawn, UNDERTAKER);
    } else if ((!creepNumberByType[PICKUP] && closestResourcesLength) || closestResourcesLength > creepNumberByType[PICKUP]) {
      CreepCreator.build(spawn, PICKUP);
    }

    const ownRooms: Room[] = Finder.findOwnRooms();
    const flags: Flag[] = Finder.getFlags(spawn.pos);
    if (flags.length && ownRooms.length < Game.gcl.level) {
      flags: for (const key in flags) {
        const flag: Flag = flags[key];


        if (!flag || flag.color !== COLOR_WHITE) {
          continue;
        }

        if (PositionUtil.closestHostiles(flag.pos).length > 0) {
          continue;
        }

        if (!flag.room || !flag.room.controller) {
          continue;
        }

        if (flag.room.controller.owner || flag.memory.claim) {
          continue;
        }

        for (const k in Game.creeps) {
          const creep: Creep = Game.creeps[k];

          if (creep.memory.claimPos) {
            continue;
          }

          if (creep.memory.role !== CLAIMER) {
            continue;
          }

          continue flags;
        }

        // @ts-ignore
        CreepCreator.build(spawn, CLAIMER, {memory: {claimPos: flag.pos, flag: flag.name}});
        break;
      }
    }
  }

  private buildExtensions(spawn: StructureSpawn): void {
    const room: Room = spawn.room;
    const targets: Array<Source | StructureSpawn> = room.find(FIND_SOURCES);
    targets.concat(room.find(FIND_MY_SPAWNS));


    targets.forEach(s => {

      const {x: baseX, y: baseY} = s.pos;

      for (let x = 1; x <= (room.controller ? room.controller.level : 1); x++) {

        const range: number = 2 * x;
        const minX: number = baseX - range;
        const maxX: number = baseX + range;
        const minY: number = baseY - range;
        const maxY: number = baseY + range;

        const rowX: number[] = [minX, maxX];
        const rowY: number[] = [minY, maxY];

        for (const posX of rowX) {
          if (posX === baseX) {
            continue;
          }

          if (posX < 0 || posX > 49) {
            continue;
          }

          for (let i = minY; i <= maxY; i++) {
            if (i === baseY) {
              continue;
            }

            if (i < 0 || i > 49) {
              continue;
            }

            const pos: RoomPosition = new RoomPosition(posX, i, s.pos.roomName);
            if (SpawnController.buildExtension(pos)) {
              return true;
            }
          }
        }
        for (const posY of rowY) {
          if (posY === baseX) {
            continue;
          }


          if (posY < 0 || posY > 49) {
            continue;
          }

          for (let i = minX; i <= maxX; i++) {
            if (i === baseX) {
              continue;
            }

            if (i < 0 || i > 49) {
              continue;
            }

            const pos: RoomPosition = new RoomPosition(i, posY, s.pos.roomName);
            if (SpawnController.buildExtension(pos)) {
              return true;
            }
          }
        }
      }
      return false;
    });
  }

  private static buildExtension(pos: RoomPosition): boolean {
    const room: Room = Game.rooms[pos.roomName];

    if (true === true) {
      return false;
    }

    if (!isBuildable(pos)) {
      return false;
    }

    if (
      pos.x > 0 && pos.x < 49
      && !isBuildable(new RoomPosition(pos.x - 1, pos.y, pos.roomName))
      && !isBuildable(new RoomPosition(pos.x + 1, pos.y, pos.roomName))
    ) {
      return false;
    }

    if (
      pos.x > 0 && pos.x < 49
      && !isBuildable(new RoomPosition(pos.x, pos.y - 1, pos.roomName))
      && !isBuildable(new RoomPosition(pos.x, pos.y + 1, pos.roomName))
    ) {
      return false;
    }

    if (
      pos.x > 0 && pos.x < 49 && pos.y > 0 && pos.y < 49
      && !isBuildable(new RoomPosition(pos.x - 1, pos.y - 1, pos.roomName))
      && !isBuildable(new RoomPosition(pos.x + 1, pos.y + 1, pos.roomName))
    ) {
      return false;
    }

    if (
      pos.x > 0 && pos.x < 49 && pos.y > 0 && pos.y < 49
      && !isBuildable(new RoomPosition(pos.x - 1, pos.y + 1, pos.roomName))
      && !isBuildable(new RoomPosition(pos.x + 1, pos.y - 1, pos.roomName))
    ) {
      return false;
    }

    const constructionSite = room.createConstructionSite(pos, STRUCTURE_EXTENSION);

    return constructionSite === OK;
  }

  private buildRoad(spawn: StructureSpawn): void {
    if (!Finder.findCreepByType(BUILDER)) {
      return;
    }

    spawn.room.find(FIND_MY_STRUCTURES, {filter: structure => structure.my})
         .forEach(structure => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, structure.pos);
           path.forEach(pos => pos.roomName === spawn.room.name && pos.look()
                                                                      .filter(s => s.structure).length === 0 && pos.createConstructionSite(
             STRUCTURE_ROAD));
         });

    spawn.room.find(FIND_STRUCTURES, {filter: structure => structure.structureType === STRUCTURE_RAMPART})
         .forEach(structure => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, structure.pos);
           path.forEach(pos => pos.roomName === spawn.room.name && pos.look()
                                                                      .filter(s => s.structure).length === 0 && pos.createConstructionSite(
             STRUCTURE_ROAD));
         });

    spawn.room.find(FIND_SOURCES_ACTIVE)
         .forEach((source: Source) => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, source.pos);
           path.forEach(pos => pos.roomName === spawn.room.name && pos.look()
                                                                      .filter(s => s.structure).length === 0 && pos.createConstructionSite(
             STRUCTURE_ROAD));
         });

    const storageStructures: StorageType[] = PositionUtil.closestEnergyStorages(spawn.pos);

    storageStructures.forEach(s => {
      const source: Source = PositionUtil.closestSources(s.pos, true)[0];

      if (!source) {
        return;
      }

      const {path}: PathFinderPath = PositionUtil.pathRoad(s.pos, source.pos);
      path.forEach(pos => pos.look()
                             .filter((element: LookAtResult) => element.structure).length === 0 && pos.createConstructionSite(
        STRUCTURE_ROAD));
    });
  }

  private buildTower(spawn: StructureSpawn): void {
    if (!spawn.room.controller || spawn.room.controller.level <= 2) {
      return;
    }

    if (spawn.room.find(
      FIND_MY_STRUCTURES,
      {filter: s => s.structureType === STRUCTURE_TOWER}
    ).length === Math.ceil((spawn.room.controller.level - 2) / 2)) {
      return;
    }

    const pos: RoomPosition = spawn.pos;
    let newPos: RoomPosition;

    const marge: number = 2;
    // - 2 = level number + 1 pour la cardinalité
    const controllerLevel: number = (spawn.room.controller.level % 3) + 1;

    const moveMoreX: boolean = controllerLevel % 1 === 0 && controllerLevel % 3 !== 0;
    const moveLessX: boolean = controllerLevel % 3 === 0;
    const moveMoreY: boolean = controllerLevel % 2 === 0 && controllerLevel % 4 !== 0;
    const moveLessY: boolean = controllerLevel % 2 === 0;

    let posX = pos.x;
    let posY = pos.y;

    do {
      posX = posX + (moveMoreX ? marge : 0) - (moveLessX ? marge : 0);
      posY = posY + (moveMoreY ? marge : 0) - (moveLessY ? marge : 0);
      newPos = new RoomPosition(posX, posY, pos.roomName);

    } while (posX >= 10 && posX <= 39 && posY >= 10 && posY <= 39 && newPos.createConstructionSite(
      STRUCTURE_TOWER) !== OK);
  }

  private buildStorage(spawn: StructureSpawn): void {
    if (!spawn.room.controller || spawn.room.controller.level <= 3 || Finder.getStorages(spawn.pos).length === 1) {
      return;
    }

    let newPos: RoomPosition | undefined;
    let counter = 1;
    const {x, y, roomName} = spawn.pos;
    let range: number = 5;

    do {
      switch (counter) {
        case 1:
          newPos = new RoomPosition(x - range, y, roomName);
          break;
        case 2:
          newPos = new RoomPosition(x, y - range, roomName);
          break;
        case 3:
          newPos = new RoomPosition(x + range, y + range, roomName);
          break;
        case 4:
          newPos = new RoomPosition(x + range, y + range, roomName);
          counter = 0;
          range++;
          break;
      }

      counter++;
    } while (counter <= 4 && newPos && newPos.createConstructionSite(STRUCTURE_STORAGE) !== OK);
  }
}
