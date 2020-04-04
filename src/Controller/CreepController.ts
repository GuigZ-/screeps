import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {BUILDER, HARVESTER, KILLER, REPAIR, UPGRADER} from '../Constants';
import {SpawnController} from './SpawnController';

export class CreepController implements ControllerInterface {
  private readonly creepName: string;

  constructor(creep: string) {
    this.creepName = creep;
  }

  private getCreep(): Creep {
    if (!Game.creeps[this.creepName] || !Game.creeps[this.creepName].my) {
      SpawnController.forceReload = true;
      throw Error(`Creep loop failed ${this.creepName}`);
    }

    return Game.creeps[this.creepName];
  }

  loop(): void {
    const creep: Creep = this.getCreep();

    if (creep.room.find(FIND_HOSTILE_CREEPS).length && creep.memory.role === KILLER) {
      this.work();
      return;
    }

    if ((!creep.memory.working || creep.memory.harvest) && creep.store.getFreeCapacity() > 0) {
      this.harvest();
    } else {
      this.work();
    }
  }

  private resetWorkingMemory(): void {
    const creep: Creep = this.getCreep();

    creep.memory.working = false;
    creep.memory.transfer = false;
    creep.memory.upgrade = false;
    creep.memory.build = false;
    creep.memory.attack = false;
  }

  private work(): void {
    const creep: Creep = this.getCreep();

    creep.memory.harvest = false;

    switch (creep.memory.role) {
      case HARVESTER:
        this.transfer() || this.build() || this.upgrade();
        break;
      case UPGRADER:
        this.upgrade() || this.transfer() || this.build();
        break;
      case BUILDER:
        this.build() || this.transfer() || this.upgrade();
        break;
      case REPAIR:
        this.repair() || this.build() || this.transfer() || this.upgrade();
        break;
      case KILLER:
        this.attack() || this.flag() || this.reserved() || this.transfer();
        break;
      default:
        throw new Error(`Work impossible ${creep.name}`);
    }

    if (!creep.memory.working) {
      this.resetWorkingMemory();
      creep.memory.target = undefined;
      this.harvest();
    }
  }

  private harvest(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working || creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      return false;
    }

    let target: RoomObject | null = null;

    if (creep.memory.source && creep.memory.source.energy > 0) {
      target = Game.getObjectById(creep.memory.source.id);
    } else if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target || !(target instanceof Source) || target.energy === 0) {
      const sources: Source[] = PositionUtil.closestSources(creep.pos);

      for (const key in sources) {
        const source: Source = sources[key];

        if (creep.harvest(source) === ERR_NOT_IN_RANGE && creep.moveTo(source) === OK) {
          creep.memory.harvest = true;
          creep.memory.target = source.id;
          break;
        }
      }
    } else {
      const harvest = creep.harvest(target);
      if (harvest === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
        return true;
      } else if (harvest === OK) {
        return true;
      }
    }

    return false;
  }

  private transfer(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working && !creep.memory.transfer) {
      return false;
    }

    this.resetWorkingMemory();

    let target: (StructureSpawn | StructureExtension | StructureTower) | undefined;

    if (!creep.memory.target) {
      const targets: (StructureSpawn | StructureExtension | StructureTower)[] = PositionUtil.closestStorages(
        creep.pos,
        true
      );

      target = targets.length ? targets[0] : undefined;
    } else {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!(target instanceof StructureSpawn) && !(target instanceof StructureExtension) && !(target instanceof StructureTower)) {
      return false;
    }

    if (target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      this.resetWorkingMemory();
      return false;
    }

    creep.memory.working = true;
    creep.memory.transfer = true;
    creep.memory.target = target.id;

    const transfer: ScreepsReturnCode = creep.transfer(target, RESOURCE_ENERGY);

    if (transfer === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return true;
    } else if (transfer === OK) {
      if (target.store.getFreeCapacity(RESOURCE_ENERGY)) {
        creep.memory.target = undefined;
      }
      return true;
    }

    this.resetWorkingMemory();

    return false;
  }

  private upgrade(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working && !creep.memory.upgrade) {
      return false;
    }

    this.resetWorkingMemory();

    let target: RoomObject | null = null;

    if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target) {
      target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
        filter: e => e.structureType === STRUCTURE_CONTROLLER && e.my
      });
    }

    if (!(target instanceof StructureController)) {
      return false;
    }

    creep.memory.working = true;
    creep.memory.upgrade = true;
    creep.memory.target = target.id;

    const upgrade: ScreepsReturnCode = creep.upgradeController(target);
    if (upgrade === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return true;
    } else if (upgrade === OK) {
      return true;
    }

    this.resetWorkingMemory();

    return false;
  }

  private build(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working && !creep.memory.build) {
      return false;
    }

    this.resetWorkingMemory();

    let target: RoomObject | null = null;

    if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target) {
      const sortByTypes: BuildableStructureConstant[] = [STRUCTURE_TOWER, STRUCTURE_EXTENSION, STRUCTURE_WALL, STRUCTURE_ROAD];

      for (const type of sortByTypes) {
        // @ts-ignore
        target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
          filter: e => e.room && e.room.name === creep.room.name && e.structureType === type
        });

        if (target) {
          break;
        }
      }
    }

    if (!(target instanceof ConstructionSite)) {
      return false;
    }

    creep.memory.working = true;
    creep.memory.build = true;
    creep.memory.target = target.id;

    const build: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES | ERR_RCL_NOT_ENOUGH = creep.build(target);

    if (build === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return true;
    } else if (build === OK) {
      return true;
    }

    this.resetWorkingMemory();

    return false;
  }

  private flag(): boolean {
    if (!Game.flags) {
      return false;
    }

    let flag: Flag | undefined;

    for (const key in Game.flags) {
      flag = Game.flags[key];
      break;
    }

    if (!flag) {
      return false;
    }

    this.getCreep()
        .moveTo(flag.pos, {visualizePathStyle: {lineStyle: undefined, stroke: '#F00', opacity: 1}});

    if (flag.pos.roomName === this.getCreep().pos.roomName && PositionUtil.closestHostiles(flag.pos).length === 0) {
      flag.remove();
    }

    return true;
  }

  private reserved(): boolean {
    const creep: Creep = this.getCreep();

    if (!creep.room.controller || creep.room.controller.owner) {
      return false;
    }

    const reserved: CreepActionReturnCode = creep.reserveController(creep.room.controller);

    if (reserved === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller.pos);
    }

    return true;
  }

  private repair(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working && !creep.memory.repair) {
      return false;
    }

    this.resetWorkingMemory();

    let target: RoomObject | null = null;

    if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target) {
      const structures: AnyStructure[] = PositionUtil.closestStructureToRepair(creep.pos);

      if (structures.length) {
        target = structures[0];
      }
    }

    if (!(target instanceof Structure)) {
      return false;
    }

    creep.memory.working = true;
    creep.memory.repair = true;
    creep.memory.target = target.id;

    const repair: CreepActionReturnCode | ERR_NOT_ENOUGH_RESOURCES = creep.repair(target);

    if (repair === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
      return true;
    } else if (repair === OK) {
      return true;
    }

    this.resetWorkingMemory();

    return false;
  }

  private attack(): boolean {
    const creep: Creep = this.getCreep();
    let target: RoomObject | null = null;

    this.resetWorkingMemory();

    if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target) {
      const hostiles: (Creep | StructureInvaderCore)[] = PositionUtil.closestHostiles(creep.pos);

      if (hostiles.length === 0) {
        return false;
      }

      target = hostiles[0];
    }

    if ((!(target instanceof Creep) && !(target instanceof StructureInvaderCore)) || target.my) {
      return false;
    }

    creep.memory.working = true;
    creep.memory.attack = true;
    creep.memory.target = target.id;

    const attack = creep.attack(target);

    if (attack === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, {visualizePathStyle: {lineStyle: undefined, stroke: '#F00', opacity: 1}});
      return true;
    } else if (attack === OK) {
      return true;
    }

    return false;
  }
}
