import {ControllerInterface} from './ControllerInterface';
import {CreepCreator} from '../CreepCreator';
import {
  BUILDER,
  CLAIMER,
  HARVESTER,
  KILLER,
  REPAIRER,
  ROOM_BUILDER,
  StorageType,
  UNDERTAKER,
  UPGRADER
} from '../Constants';
import {PositionUtil} from '../Utils/PositionUtil';
import {Finder} from '../Utils/Finder';

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

    if (Game.time % 100 !== 0) {
      return;
    }

    this.buildExtension(spawn);
    this.buildRoad(spawn);
    this.buildTower(spawn);
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

    if (room.find(FIND_HOSTILE_CREEPS).length !== 0 || !creepNumberByType[KILLER]) {
      CreepCreator.build(spawn, KILLER);
    }

    const sourcesNumber: number = room.find(FIND_SOURCES, {filter: s => s.room.name === room.name}).length;
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

    if (spawn.room.energyAvailable < spawn.room.energyCapacityAvailable * 0.5) {
      return;
    }

    const rooms: Room[] = Finder.findRoomsToBuild();
    if (!creepNumberByType[UPGRADER] || creepNumberByType[UPGRADER] < controllerNumber * 2) {
      CreepCreator.build(spawn, UPGRADER);
    } else if (!creepNumberByType[BUILDER] || creepNumberByType[BUILDER] < 2) {
      CreepCreator.build(spawn, BUILDER);
    } else if (!creepNumberByType[REPAIRER] || creepNumberByType[REPAIRER] < Math.min(
      2,
      spawn.room.controller ? spawn.room.controller.level : 2
    )) {
      CreepCreator.build(spawn, REPAIRER);
    } else if (rooms.length) {
      // @ts-ignore
      CreepCreator.build(spawn, ROOM_BUILDER, {memory: {room: rooms[0].name}});
    } else if (!creepNumberByType[UNDERTAKER]) {
      CreepCreator.build(spawn, UNDERTAKER);
    }

    const ownRooms: Room[] = Finder.findOwnRooms();

    if (Object.keys(Game.flags).length && ownRooms.length < Game.gcl.level) {
      const flags: Flag[] = _.sortBy(Game.flags, f => spawn.pos.getRangeTo(f.pos));
      flags: for (const key in flags) {
        const flag: Flag = flags[key];

        if (!flag) {
          continue;
        }

        if (PositionUtil.closestHostiles(flag.pos).length > 0) {
          continue;
        }

        if (!flag.room || !flag.room.controller) {
          continue;
        }

        if (flag.room.controller.owner) {
          continue;
        }

        for (const k in Game.creeps) {
          const creep: Creep = Game.creeps[k];

          if (!creep.memory.flag) {
            continue;
          }

          if (creep.memory.flag !== flag.name) {
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

  private buildExtension(spawn: StructureSpawn): void {
    const room: Room = spawn.room;
    const targets: (Source | StructureSpawn)[] = room.find(FIND_SOURCES);
    targets.concat(room.find(FIND_MY_SPAWNS));

    const range: number = 3 + (room.controller ? room.controller.level - 1 : 1);

    targets.forEach(s => {
      const {x: posX, y: posY} = s.pos;
      for (let i = Math.max(0, posX - range); i < Math.min(49, posX + range); i++) {
        if (i === posX || i % 2 !== 0 || (i > posX - 3 && i < posX + 3) || Math.abs(i - posX) <= 2) {
          continue;
        }

        for (let j = Math.max(0, posY - range); j < Math.min(49, posY + range); j++) {
          if (j === posY || (j > posY - 3 && j < posY + 3) || Math.abs(j - posY) <= 2) {
            continue;
          }

          const pos: RoomPosition = new RoomPosition(i, j, room.name);

          if (room.lookAt(pos.x - 1, pos.y)
                  .filter(e => e.terrain === 'wall').length
            && room.lookAt(pos.x + 1, pos.y)
                   .filter(e => e.terrain === 'wall').length) {
            continue;
          }

          if (room.lookAt(pos.x, pos.y - 1)
                  .filter(e => e.terrain === 'wall').length
            && room.lookAt(pos.x, pos.y + 1)
                   .filter(e => e.terrain === 'wall').length) {
            continue;
          }

          if (room.lookAt(pos.x - 1, pos.y - 1)
                  .filter(e => e.terrain === 'wall').length
            && room.lookAt(pos.x + 1, pos.y + 1)
                   .filter(e => e.terrain === 'wall').length) {
            continue;
          }

          if (room.lookAt(pos.x - 1, pos.y + 1)
                  .filter(e => e.terrain === 'wall').length
            && room.lookAt(pos.x + 1, pos.y - 1)
                   .filter(e => e.terrain === 'wall').length) {
            continue;
          }

          if (room.lookAt(pos)
                  .filter(e => e.terrain === 'plain' || e.terrain === 'swamp').length) {
            room.createConstructionSite(i, j, STRUCTURE_EXTENSION);
          }
        }
      }
    });
  }

  private buildRoad(spawn: StructureSpawn): void {
    if (!Finder.findCreepByType(BUILDER)) {
      return;
    }

    spawn.room.find(FIND_MY_STRUCTURES, {filter: structure => structure.my})
         .forEach(structure => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, structure.pos);
           path.forEach(pos => pos.look()
                                  .filter(s => s.structure).length === 0 && pos.createConstructionSite(STRUCTURE_ROAD));
         });

    spawn.room.find(FIND_STRUCTURES, {filter: structure => structure.structureType === STRUCTURE_RAMPART})
         .forEach(structure => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, structure.pos);
           path.forEach(pos => pos.look()
                                  .filter(s => s.structure).length === 0 && pos.createConstructionSite(STRUCTURE_ROAD));
         });

    spawn.room.find(FIND_SOURCES_ACTIVE)
         .forEach((source: Source) => {
           const {path}: PathFinderPath = PositionUtil.pathRoad(spawn.pos, source.pos);
           path.forEach(pos => pos.look()
                                  .filter(s => s.structure).length === 0 && pos.createConstructionSite(STRUCTURE_ROAD));
         });

    const storageStructures: StorageType[] = PositionUtil.closestStorages(spawn.pos);

    storageStructures.forEach(s => {
      const source: Source = PositionUtil.closestSources(s.pos, true)[0];

      if (!source) {
        return;
      }

      const {path}: PathFinderPath = PositionUtil.pathRoad(s.pos, source.pos);
      path.forEach(pos => pos.look()
                             .filter(s => s.structure).length === 0 && pos.createConstructionSite(STRUCTURE_ROAD));
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
}
