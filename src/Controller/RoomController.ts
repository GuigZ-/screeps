import {PositionUtil} from '../utils/PositionUtil';
import {RoleController} from './RoleController';

export class RoomController {
  private roleController: RoleController;
  private roomName: string;

  constructor(roomName: string) {
    this.roomName = roomName;
    this.roleController = new RoleController(roomName);
  }

  public loop(): void {
    console.log(`Room ${this.roomName}`);

    this.roleController.loop();

    // this.buildExtractor();
    const room: Room = Game.rooms[this.roomName];

    if (!room || !room.controller) {
      return;
    }

    this.buildExtension();

    if (room.controller.level >= 3) {
      this.buildRoad();
      this.towers();
    }
  }

  private buildExtractor(): void {
    Game.rooms[this.roomName].find(FIND_MINERALS).forEach((mineral: Mineral) => {

      const hasConstructionSite = mineral.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1, {filter: (a: ConstructionSite) => a.structureType === STRUCTURE_CONTAINER}).length !== 0;

      if (hasConstructionSite) {
        return;
      }

      const hasContainer = mineral.pos.findInRange(FIND_MY_STRUCTURES, 1, {filter: (a: OwnedStructure) => a.structureType === STRUCTURE_CONTAINER}).length !== 0;

      if (hasContainer) {
        return;
      }

      const room: Room | undefined = mineral.room;
      if (!room) {
        return;
      }

      const spawn: StructureSpawn | undefined = room.find(FIND_MY_SPAWNS)[0];
      if (!spawn) {
        return;
      }

      const containerPos = PositionUtil.buildNearPosition(spawn.pos, mineral.pos);

      if (containerPos) {
        console.log(containerPos.createConstructionSite(STRUCTURE_EXTRACTOR));
      }
    });
  }

  private buildRoad(): void {
    const room: Room = Game.rooms[this.roomName];

    if (!room) {
      return;
    }

    const anyStructures: AnyStructure[] = room.find(FIND_MY_STRUCTURES);

    if (anyStructures.length === 0) {
      return;
    }

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

    });
  }

  private buildExtension(): void {
    const room = Game.rooms[this.roomName];

    if (!room) {
      return;
    }

    const nbConstructionsSites: number = room.find(FIND_MY_CONSTRUCTION_SITES).filter((structure: ConstructionSite) => {
      console.log(`${structure.structureType} => ${(structure.progress / structure.progressTotal * 100).toFixed(2)} %`);
      return structure.structureType === STRUCTURE_EXTENSION;
    }).length;

    if (nbConstructionsSites > 0) {
      return;
    }

    // @ts-ignore
    let targets: (Source | StructureSpawn)[] = room.find(FIND_SOURCES).concat(room.find(FIND_MY_SPAWNS));

    if (targets.length === 0) {
      return;
    }

    const range: number = Math.round((room.controller ? room.controller.level / 2 : 2) * 3);

    targets.forEach((target: Source | StructureSpawn) => {
      const {x, y} = target.pos;
      for (let i = x - range; i <= x + range; i++) {
        if (i === x || Math.abs(i - range) % 3 !== 0) {
          continue;
        }

        for (let j = y - range; j <= y + range; j++) {
          if (j === y || Math.abs(j - range) % 3 !== 0) {
            continue;
          }

          const pos: RoomPosition = new RoomPosition(i, j, room.name);
          const target: LookAtResult[] = room.lookAt(pos).filter(r => {
            // console.log(r.terrain, i, j);
            return r.terrain === 'plain';
          });

          if (target.length === 0) {
            continue;
          }

          const success: number = pos.createConstructionSite(STRUCTURE_EXTENSION);

          if (success === OK) {
            break;
          }
        }
      }
    });
  }

  private towers(): void {
    const room: Room = Game.rooms[this.roomName];

    if (!room) {
      return;
    }

    // @ts-ignore
    const towers: StructureTower[] = room.find(
      FIND_MY_STRUCTURES, {filter: (t: StructureTower) =>  t.structureType === STRUCTURE_TOWER && t.store[RESOURCE_ENERGY] > t.store.getCapacity(RESOURCE_ENERGY) / 2});

    if (towers.length === 0) {
      return;
    }

    const hostiles: (Creep | PowerCreep)[] = room.find(FIND_HOSTILE_CREEPS);
    hostiles.concat(room.find(FIND_HOSTILE_POWER_CREEPS));
    if (hostiles.length > 0) {
      const username = hostiles[0].owner.username;
      Game.notify(`User ${username} spotted in room ${this.roomName}`);
      towers.forEach(tower => tower.attack(hostiles[0]));
    }

    const opts: FilterOptions<any> = {
      filter: (object: Creep | PowerCreep | AnyStructure) => object.hits < (object.hitsMax / 3),
    };

    // @ts-ignore
    const anyStructures: AnyStructure[] = room.find(FIND_STRUCTURES, opts).filter(s => (s.structureType === STRUCTURE_WALL || s.structureType === STRUCTURE_RAMPART) && s.hits < s.hitsMax / 50);
    if (anyStructures.length > 0) {
      towers.forEach(tower => tower.repair(anyStructures[0]));
    }

    // @ts-ignore
    const creeps: (Creep | PowerCreep)[] = room.find(FIND_MY_CREEPS, opts);
    // @ts-ignore
    creeps.concat(room.find(FIND_MY_POWER_CREEPS, opts));
    if (creeps.length > 0) {
      // @ts-ignore
      towers.forEach(tower => tower.heal(creeps[0]));

    }
  }
}
