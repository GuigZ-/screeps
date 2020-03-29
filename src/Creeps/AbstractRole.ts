import {CreepRoleInterface} from './CreepRoleInterface';

export abstract class AbstractRole implements CreepRoleInterface {
  protected creepNames: string[] = [];
  protected byRooms: number = 0;

  addCreep(creep: Creep): void {
    if (creep.memory.role !== this.getRole()) {
      return;
    }

    this.creepNames.push(creep.name);
    this.creepNames = _.unique(this.creepNames);
  }

  nbCreeps(): number {
    return this.creepNames.length;
  }

  abstract getRole(): string;

  invoke(spawn: StructureSpawn): string | undefined {
    // @ts-ignore
    let opts: SpawnOptions = {memory: {role: this.getRole(), spawnName: spawn.name}};
    let success: number;
    let name: string;
    let id: number = 0;
    const basicBodyPart: BodyPartConstant[] = [WORK, CARRY, MOVE];
    let loopNumber: number = Math.round((50 - basicBodyPart.length) / this.getBodyPart().length);
    do {
      let resetBodyPart: BodyPartConstant[] = basicBodyPart;
      for (let i = loopNumber; i > 0; i--) {
        resetBodyPart = resetBodyPart.concat(this.getBodyPart());
      }

      // @ts-ignore
      opts.memory.number = id;

      name = `${spawn.room.name}_${this.getRole()
                                       .toLowerCase()}_${id}`;
      success = spawn.spawnCreep(resetBodyPart, name, opts);

      if (success === ERR_NAME_EXISTS) {
        id++;
      } else if (success !== ERR_NAME_EXISTS) {
        loopNumber--;
        // console.log(`Error create creep ${success} ${this.getRole()} ${loopNumber}`);
      }

    } while (success !== 0 && loopNumber >= 0);

    return success === OK ? name : undefined;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [WORK, CARRY, MOVE];
  }

  abstract move(): void;

  abstract creepNeeded(room: Room): number;

  public manage(roomName: string): string | undefined {
    const room = Game.rooms[roomName];

    if (room === undefined || ((room.energyAvailable / room.energyCapacityAvailable) < 0.5 && this.nbCreeps() > 0)) {
      return undefined;
    }

    if (this.creepNeeded(room) <= this.nbCreeps() && this.nbCreeps() > 0) {
      return undefined;
    }

    const spawnsList: StructureSpawn[] = room.find(FIND_MY_SPAWNS);

    if (spawnsList.length === OK) {
      return undefined;
    }

    let lightestSpawn: StructureSpawn = spawnsList[0];

    spawnsList.forEach((spawn: StructureSpawn) => {
      // Create creeps array if does not exist
      if (lightestSpawn.memory.creeps === undefined) {
        lightestSpawn.memory.creeps = [];
      }

      if (lightestSpawn.memory.creeps.length > spawn.memory.creeps.length) {
        lightestSpawn = spawn;
      }
    });

    return this.invoke(lightestSpawn);
  }

  protected build(creep: Creep): boolean {
    if (creep.memory.transfer || creep.memory.upgrade || creep.memory.repair || creep.memory.wall_build) {
      return false;
    }

    if (creep.memory.target && Game.getObjectById(creep.memory.target) instanceof ConstructionSite) {
      return this.buildTarget(creep, Game.getObjectById(creep.memory.target)) === true;
    }

    const targetsConstructionSites = creep.pos.findInRange(
      FIND_MY_CONSTRUCTION_SITES,
      50,
      {filter: (c => c.room && c.room.name === creep.room.name)}
    );
    const targets: ConstructionSite[] = _.sortBy(targetsConstructionSites, s => creep.pos.getRangeTo(s));

    for (const k in targets) {
      const target: ConstructionSite = targets[k];
      if (this.buildTarget(creep, target)) {
        return true;
      }
    }
    creep.memory.build = false;

    return false;
  }

  private buildTarget(creep: Creep, target: ConstructionSite): boolean {
    const build: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH = creep.build(target);
    creep.memory.build = true;
    creep.memory.target = target.id;
    if (build === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
      return true;
    } else if (build !== OK) {
      creep.memory.target = undefined;
      creep.memory.build = false;
    }

    return build === OK;
  }

  protected wallBuild(creep: Creep): boolean {
    if (creep.memory.transfer || creep.memory.upgrade || creep.memory.repair || creep.memory.build) {
      return false;
    }

    if (creep.memory.target && Game.getObjectById(creep.memory.target) instanceof StructureWall) {
      return this.buildTarget(creep, Game.getObjectById(creep.memory.target)) === true;
    }

    const targetsConstructionSites = creep.pos.findInRange(
      FIND_STRUCTURES,
      50,
      {filter: (s => s.room && s.room.name === creep.room.name && s.structureType === STRUCTURE_WALL)}
    );
    // @ts-ignore
    const targets: StructureWall[] = _.sortBy(targetsConstructionSites, s => creep.pos.getRangeTo(s));

    for (const k in targets) {
      const target: StructureWall = targets[k];
      if (this.wallBuildTarget(creep, target)) {
        return true;
      }
    }
    creep.memory.wall_build = false;

    return false;
  }

  private wallBuildTarget(creep: Creep, target: StructureWall): boolean {
    const build: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH = creep.repair(target);
    creep.memory.wall_build = true;
    creep.memory.target = target.id;
    if (build === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {stroke: '#0000ff'}});
      return true;
    } else if (build !== OK) {
      creep.memory.target = undefined;
      creep.memory.wall_build = false;
    }

    return build === OK;
  }

  protected repair(creep: Creep): boolean {
    if (creep.memory.transfer || creep.memory.upgrade || creep.memory.build || creep.memory.wall_build) {
      return false;
    }

    if (creep.memory.target && Game.getObjectById(creep.memory.target) instanceof Structure) {
      return this.repairTarget(creep, Game.getObjectById(creep.memory.target)) === true;
    }

    const targetsConstructionSites = creep.pos.findInRange(
      FIND_STRUCTURES,
      50,
      {filter: (c => c.room && c.room.name === creep.room.name && c.hits < c.hitsMax && c.structureType !== STRUCTURE_WALL)}
    );
    const targets: Structure[] = _.sortBy(targetsConstructionSites, s => creep.pos.getRangeTo(s));

    for (const k in targets) {
      const target: Structure = targets[k];
      if (this.repairTarget(creep, target)) {
        return true;
      }
    }
    creep.memory.repair = false;

    return false;
  }

  private repairTarget(creep: Creep, target: Structure): boolean {
    const repair: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES = creep.repair(target);

    creep.memory.repair = true;
    creep.memory.target = target.id;

    if (repair === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
      return true;
    } else if (repair !== OK) {
      creep.memory.target = undefined;
      creep.memory.repair = false;
    }
    return repair === OK;
  }

  private readonly _range = 50;

  protected harvest(creep: Creep): boolean {
    if (creep.memory.working) {
      return false;
    }

    if (creep.memory.target) {
      return this.harvestTarget(creep, Game.getObjectById(creep.memory.target)) === true;
    }

    const sourcesList: (Source | Ruin)[] = creep.pos.findInRange(FIND_SOURCES_ACTIVE, this._range);
    sourcesList.concat(creep.pos.findInRange(FIND_RUINS, this._range));
    const sources: (Source | Ruin)[] = _.sortBy(sourcesList, s => creep.pos.getRangeTo(s));
    for (const k in sources) {
      const source: (Source | Ruin) = sources[k];
      if (this.harvestTarget(creep, source)) {
        return true;
      }
    }

    creep.memory.harvest = false;

    return false;
  }

  private harvestTarget(creep: Creep, source: Source | Ruin): boolean {
    const harvest = source instanceof Source ? creep.harvest(source) : creep.withdraw(source, RESOURCE_ENERGY);
    creep.memory.harvest = true;
    creep.memory.target = source.id;
    if (harvest === ERR_NOT_IN_RANGE) {
      if (creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}}) !== OK) {
        creep.memory.target = undefined;
        creep.memory.harvest = false;
        return false;
      }
      return true;
    } else if (harvest === ERR_FULL) {
      creep.memory.target = undefined;
      return false;
    } else if (harvest !== OK) {
      creep.memory.target = undefined;
      creep.memory.harvest = false;
    }

    return harvest === OK;
  }

  protected upgrade(creep: Creep): boolean {
    if (creep.memory.build || creep.memory.transfer || creep.memory.repair || creep.memory.wall_build) {
      return false;
    }

    if (creep.room.name === 'W8N9') {
      creep.memory.upgrade = true;
      creep.moveTo(49, 14);
      return false;
    }

    if (creep.room.controller && creep.room.controller.my && creep.upgradeController(creep.room.controller) === ERR_NOT_IN_RANGE) {
      creep.memory.upgrade = true;
      creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#00ffff'}});
      return true;
    } else if (creep.room.controller && creep.upgradeController(creep.room.controller) !== OK) {
      creep.memory.upgrade = false;
    }

    return false;
  }

  protected transfer(creep: Creep): boolean {
    if (creep.memory.build || creep.memory.upgrade || creep.memory.repair || creep.memory.wall_build) {
      return false;
    }

    if (creep.memory.target && Game.getObjectById(creep.memory.target) instanceof Structure) {
      return this.transferTarget(creep, Game.getObjectById(creep.memory.target)) === true;
    }

    const availableStructure = [
      STRUCTURE_EXTENSION,
      STRUCTURE_SPAWN,
      STRUCTURE_CONTAINER,
      STRUCTURE_TOWER,
    ];

    // @ts-ignore
    const allTargets: (StructureSpawn | StructureExtension | StructureContainer | StructureTower)[] = creep.pos.findInRange(
      FIND_MY_STRUCTURES,
      50,
      {
        filter: (structure: StructureSpawn | StructureExtension | StructureContainer | StructureTower) => {
          return structure.room.name === creep.room.name && availableStructure.includes(structure.structureType) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
      }
    );
    const targets: (StructureSpawn | StructureExtension | StructureContainer | StructureTower)[] = _.sortBy(
      allTargets,
      s => s.structureType === STRUCTURE_TOWER ? 999 : creep.pos.getRangeTo(s)
    );

    for (const t in targets) {
      const target: (StructureSpawn | StructureExtension | StructureContainer | StructureTower) = targets[t];
      if (this.transferTarget(creep, target)) {
        return true;
      }
    }

    creep.memory.transfer = false;

    return false;
  }

  private transferTarget(creep: Creep, target: Structure): boolean {
    const transfer: ScreepsReturnCode = creep.transfer(target, RESOURCE_ENERGY);
    creep.memory.transfer = true;
    creep.memory.target = target.id;
    if (transfer === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {stroke: '#ff00ff'}});
      return true;
    } else if (transfer === ERR_FULL) {
      creep.memory.target = undefined;
      return false;
    } else if (transfer !== OK) {
      creep.memory.transfer = false;
    }

    return transfer === OK;

  }

  protected initMemoryWork(creep: Creep): void {
    if ((creep.memory.working || creep.memory.working === undefined) && creep.store[RESOURCE_ENERGY] === 0
    ) {
      creep.memory.working = false;
      creep.memory.transfer = false;
      creep.memory.build = false;
      creep.memory.upgrade = false;
      creep.memory.harvest = false;
      creep.memory.wall_build = false;
      creep.memory.target = undefined;
    } else if (creep.store.getFreeCapacity() === 0) {
      creep.memory.working = true;
      creep.memory.harvest = false;
      creep.memory.target = undefined;
    }
  }

  protected renew(creep: Creep): boolean {
    if ((!creep.ticksToLive || creep.ticksToLive > 50) && !creep.memory.renew) {
      return false;
    }

    const spawn: StructureSpawn = Game.spawns[creep.memory.spawnName];

    if (!spawn) {
      return false;
    }

    console.log(`Renew ${creep.name}`);

    const renewCreep: ScreepsReturnCode = spawn.renewCreep(creep);

    if (renewCreep === ERR_NOT_IN_RANGE) {
      creep.memory.renew = true;
      creep.moveTo(spawn);
      return true;
    } else if (renewCreep === OK) {
      return true;
    }

    creep.memory.renew = false;

    return false;

  }
}
