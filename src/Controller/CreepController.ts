import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {BUILDER, HARVESTER, UPGRADER} from '../Constants';

export class CreepController implements ControllerInterface {
  private readonly creepName: string;

  constructor(creep: string) {
    this.creepName = creep;
  }

  private getCreep(): Creep {
    const creep: Creep = Game.creeps[this.creepName];

    if (!creep || !creep.my) {
      throw Error(`Creep loop failed ${this.creepName}`);
    }

    return creep;
  }

  loop(): void {
    const creep: Creep = this.getCreep();

    if (!creep.memory.working || creep.memory.harvest) {
      this.harvest();
    } else {
      this.work();
    }
  }

  private resetWorkingMemory() : void
  {
    const creep: Creep = this.getCreep();

    creep.memory.working = false;
    creep.memory.transfer = false;
    creep.memory.upgrade = false;
    creep.memory.build = false;

  }

  private work(): void {
    const creep: Creep = this.getCreep();

    creep.memory.harvest = false;

    switch (creep.memory.role) {
      case HARVESTER:
        this.transfer() || this.upgrade() || this.build();
        break;
      case UPGRADER:
        this.upgrade() || this.transfer() || this.build();
        break;
      case BUILDER:
        this.build() || this.transfer() || this.upgrade();
        break;
      default:
        throw new Error(`Work impossible`);
    }

    if (!creep.memory.working) {
      creep.memory.upgrade = false;
      creep.memory.transfer = false;
      creep.memory.target = undefined;
      this.harvest();
    }
  }

  private harvest(): boolean {
    const creep: Creep = this.getCreep();

    if (creep.memory.working) {
      return false;
    }

    let target: RoomObject | null = null;

    if (creep.memory.target) {
      target = Game.getObjectById(creep.memory.target);
    }

    if (!target || !(target instanceof Source)) {
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
      } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
        creep.memory.target = undefined;
        this.work();
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

    const target: StructureSpawn | null = creep.pos.findClosestByPath(FIND_MY_SPAWNS);

    if (!target) {
      return false;
    }

    if (target.store.getFreeCapacity(RESOURCE_ENERGY) === 0) {
      creep.memory.transfer = false;
      return false;
    }

    creep.memory.working = true;
    creep.memory.transfer = true;
    creep.memory.target = target.id;

    const transfer: ScreepsReturnCode = creep.transfer(target, RESOURCE_ENERGY);

    if (transfer === ERR_NOT_IN_RANGE) {
      creep.moveTo(target);
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
      // @ts-ignore
      target = creep.pos.findClosestByPath(FIND_MY_CONSTRUCTION_SITES, {
        filter: e => e.room && e.room.name === creep.room.name
      });
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
}
