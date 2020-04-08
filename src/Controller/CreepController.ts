import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {BUILDER, CLAIMER, HARVESTER, KILLER, REPAIRER, ROOM_BUILDER, UPGRADER} from '../Constants';
import {SpawnController} from './SpawnController';
import {Finder} from '../Utils/Finder';
import {Harvest} from '../Works/Harvest';
import {WorkInterface} from '../Works/WorkInterface';
import {Transfer} from '../Works/Transfer';
import {Upgrade} from '../Works/Upgrade';
import {Build} from '../Works/Build';
import {Repair} from '../Works/Repair';
import {Attack} from '../Works/Attack';

export class CreepController implements ControllerInterface {
  private readonly creepName: string;
  private worksByType: { [p: string]: WorkInterface[] };

  constructor(creep: string) {
    this.creepName = creep;

    const harvest: Harvest = new Harvest();
    const transfer: Transfer = new Transfer();
    const build: Build = new Build();
    const upgrade: Upgrade = new Upgrade();
    const repair: Repair = new Repair();
    const attack: Attack = new Attack();

    this.worksByType = {
      [BUILDER]: [harvest, build, transfer, upgrade],
      // [CLAIMER]: [harvest],
      [HARVESTER]: [harvest, transfer, build, upgrade],
      // [KILLER]: [harvest],
      [REPAIRER]: [harvest, repair, build, transfer, upgrade],
      // [ROOM_BUILDER]: [harvest],
      [UPGRADER]: [harvest, upgrade, transfer, build],
    }
  }

  private getCreep(): Creep {
    if (!Object.keys(Game.creeps)
               .includes(this.creepName) || !Game.creeps[this.creepName] || !Game.creeps[this.creepName].my) {
      SpawnController.forceReload = true;
      throw Error(`Creep loop failed ${this.creepName}`);
    }

    return Game.creeps[this.creepName];
  }

  loop(): void {
    const creep: Creep = this.getCreep();

    if ((creep.room.find(FIND_HOSTILE_CREEPS).length || Game.flags) && creep.memory.role === KILLER) {
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

    CreepController.resetMemory(creep);
  }

  public static resetMemory(creep: Creep): void {
    creep.memory.working = false;
    creep.memory.transfer = false;
    creep.memory.upgrade = false;
    creep.memory.build = false;
    creep.memory.attack = false;
    creep.memory.claim = false;
  }

  private work(): void {
    const creep: Creep = this.getCreep();

    creep.memory.harvest = false;

    if (this.worksByType[creep.memory.role]) {
      for (const work of this.worksByType[creep.memory.role]) {
        if (work.work(creep)) {
          break;
        }
      }
    } else {
      switch (creep.memory.role) {
        case ROOM_BUILDER:
          this.roomBuilder() || this.build() || this.transfer();
          break;
        case KILLER:
          this.attack() || this.flag() || this.reserved() || this.build() || this.transfer();
          break;
        case CLAIMER:
          this.flag() || this.claim() || this.build() || this.transfer();
          break;
        default:
          throw new Error(`Work impossible ${creep.name}`);
      }
    }

    if (creep.store.getCapacity(RESOURCE_ENERGY) === creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      CreepController.resetMemory(creep);
    }

    if (!creep.memory.working) {
      creep.memory.target = undefined;
      this.harvest();
    }
  }

  // ============================

  private harvest(): boolean {
    const creep: Creep = this.getCreep();

    return (new Harvest()).work(creep);
  }

  private transfer(): boolean {
    const creep: Creep = this.getCreep();

    return (new Transfer()).work(creep);
  }

  private build(): boolean {

    const creep: Creep = this.getCreep();

    return (new Build()).work(creep);
  }

  private attack(): boolean {
    const creep: Creep = this.getCreep();

    return (new Attack()).work(creep);
  }

  // ============================

  private flag(): boolean {
    if (!Game.flags) {
      return false;
    }

    const creep: Creep = this.getCreep();

    if (creep.memory.working && !creep.memory.flag) {
      return false;
    }

    this.resetWorkingMemory();

    creep.memory.working = true;

    let flag: Flag | undefined;

    if (!creep.memory.flag) {

      if (Object.keys(Game.flags).length) {
        const flags: Flag[] = _.sortBy(Game.flags, f => creep.pos.getRangeTo(f.pos));
        for (const key in flags) {
          const f: Flag = flags[key];
          if (!f) {
            continue;
          }

          if (PositionUtil.closestHostiles(f.pos).length > 0 && creep.memory.role !== KILLER) {
            continue;
          }

          console.log('gogogo');
          creep.memory.flag = f.name;
          flag = f;
          break;
        }
      }
    } else {
      flag = Game.flags[creep.memory.flag];
    }

    if (!flag || (flag.room && creep.room.name === flag.room.name)) {
      return false;
    }

    if (creep.moveTo(flag) === OK) {
      return true;
    }

    return false;
  }

  private claim(): boolean {
    const creep: Creep = this.getCreep();

    this.resetWorkingMemory();

    if (!creep.room.controller || creep.room.controller.owner) {
      return false;
    }

    creep.memory.working = true;
    creep.memory.claim = true;

    const claim: CreepActionReturnCode | ERR_FULL | ERR_GCL_NOT_ENOUGH = creep.claimController(creep.room.controller);

    if (claim === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller.pos, {visualizePathStyle: {lineStyle: undefined, stroke: '#0F0', opacity: 1}});
    } else if (claim === ERR_FULL) {
      this.harvest();
      return false;
    } else if (claim === ERR_INVALID_TARGET) {
      creep.attackController(creep.room.controller);
    }

    return true;
  }

  private reserved(): boolean {
    const creep: Creep = this.getCreep();

    this.resetWorkingMemory();

    if (!creep.room.controller || creep.room.controller.owner) {
      return false;
    }

    creep.memory.working = true;

    const attackController: CreepActionReturnCode = creep.attackController(creep.room.controller);

    if (attackController === ERR_NOT_IN_RANGE) {
      creep.moveTo(creep.room.controller.pos);
      return true;
    } else if (attackController === OK) {
      return true;
    }

    console.log(attackController);

    return false;
  }

  private roomBuilder(): boolean {
    const creep: Creep = this.getCreep();

    this.resetWorkingMemory();

    const rooms: Room[] = Finder.findRoomsToBuild();

    if (!rooms.length) {
      return false;
    }

    const room: Room = rooms[0];
    if (!room) {
      return false;
    }

    if (!room.controller) {
      return false;
    }

    if (creep.room.name === room.controller.room.name) {
      return false;
    }

    creep.memory.working = true;

    creep.moveTo(room.controller.pos, {visualizePathStyle: {lineStyle: undefined, stroke: '#00F', opacity: 1}});

    return true;
  }
}
