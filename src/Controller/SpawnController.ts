import {ControllerInterface} from './ControllerInterface';
import {CreepCreator} from '../CreepCreator';
import {BUILDER, HARVESTER, UPGRADER} from '../Constants';
import {PositionUtil} from '../Utils/PositionUtil';

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

    this.buildExtension(spawn);
    this.buildRoute(spawn);
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

    const sourcesNumber: number = room.find(FIND_SOURCES, {filter: s => s.room.name === room.name}).length;
    const controllerNumber: number = room.find(
      FIND_STRUCTURES,
      {filter: s => s.room.name === room.name && s.structureType === STRUCTURE_CONTROLLER}
    ).length;
    const constructionSiteNumber: number = room.find(
      FIND_MY_CONSTRUCTION_SITES,
      {filter: s => s.room && s.room.name === room.name}
    ).length;


    if (!creepNumberByType[HARVESTER] || creepNumberByType[HARVESTER] < sourcesNumber) {
      CreepCreator.build(spawn, HARVESTER);
    } else if (!creepNumberByType[UPGRADER] || creepNumberByType[UPGRADER] < controllerNumber * 2) {
      CreepCreator.build(spawn, UPGRADER);
    } else if (!creepNumberByType[BUILDER] || (creepNumberByType[BUILDER] < constructionSiteNumber / 10)) {
      CreepCreator.build(spawn, BUILDER);
    }
  }

  private buildExtension(spawn: StructureSpawn): void {
    const room: Room = spawn.room;
    const targets: (Source | StructureSpawn)[] = room.find(FIND_SOURCES);
    targets.concat(room.find(FIND_MY_SPAWNS));

    const range: number = 4 * (room.controller ? room.controller.level - 1 : 1);

    targets.forEach(s => {
      const {x: posX, y: posY} = s.pos;
      for (let i = Math.max(0, posX - range); i < Math.min(49, posX + range); i++) {
        if (i === posX || i % 2 !== 0 || (i > posX - 3 && i < posX + 3) || Math.abs(i - posX) <= 2) {
          continue;
        }

        for (let j = Math.max(0, posY - range); j < Math.min(49, posY + range); j++) {
          if (j === posY || j % 2 !== 0 || (j > posY - 3 && j < posY + 3) || Math.abs(j - posY) <= 2) {
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

          if (pos.findInRange(FIND_MY_STRUCTURES, 3).length) {
            continue;
          }

          if (room.lookAt(pos)
                  .filter(e => e.terrain === 'plain').length) {
            room.createConstructionSite(i, j, STRUCTURE_EXTENSION);
          }
        }
      }
    });
  }

  private buildRoute(spawn: StructureSpawn): void {
    if (Game.time % 100 !== 0) {
      return;
    }

    const structures: AnyStructure[] = spawn.room.find(FIND_MY_STRUCTURES, {filter: s => s.my});

    /**
     anyStructures.forEach((structure: AnyStructure) => {
      const spawns = structure.room.find(FIND_MY_SPAWNS);
      if (spawns.length === 0) {
        return;
      }

      const spawn = spawns[0];

      if (spawn) {
        const path: PathFinderPath = PositionUtil.pathRoad(spawn.pos, structure.pos);

        path.path.forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      }
    });

     room.find(FIND_SOURCES_ACTIVE).forEach((source: Source) => {
      const spawn = source.room.find(FIND_MY_SPAWNS)[0];
      if (spawn) {
        const path: PathFinderPath = PositionUtil.pathRoad(spawn.pos, source.pos);

        path.path.forEach(pos => pos.createConstructionSite(STRUCTURE_ROAD));
      }
    });

     const available: string[] = [STRUCTURE_EXTENSION, STRUCTURE_SPAWN];

     const structures: Structure[] = room.find(FIND_MY_STRUCTURES).filter(s => available.includes(s.structureType));
     const range: number = 1;

     structures.forEach((s: Structure) => {
      for (let i = s.pos.x - range; i <= s.pos.x + range; i++) {
        for (let j = s.pos.y - range; j <= s.pos.y + range; j++) {
          const pos: RoomPosition = new RoomPosition(i, j, this.roomName);
          if (Game.rooms[this.roomName].lookAt(pos).filter(r => r.terrain === 'plain').length === 0) {
            continue;
          }

          if (pos.createConstructionSite(STRUCTURE_ROAD) === OK) {
            break;
          }
        }
      }

    });**/
  }
}
