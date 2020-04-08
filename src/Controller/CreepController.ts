import {ControllerInterface} from './ControllerInterface';
import {BUILDER, CLAIMER, HARVESTER, KILLER, REPAIRER, ROOM_BUILDER, UPGRADER} from '../Constants';
import {SpawnController} from './SpawnController';
import {Harvest} from '../Works/Harvest';
import {WorkInterface} from '../Works/WorkInterface';
import {Transfer} from '../Works/Transfer';
import {Upgrade} from '../Works/Upgrade';
import {Build} from '../Works/Build';
import {Repair} from '../Works/Repair';
import {Attack} from '../Works/Attack';
import {Claim} from '../Works/Claim';
import {ToFlag} from '../Works/ToFlag';
import {RoomBuilder} from '../Works/RoomBuilder';
import {resetMemory} from '../Utils/CreepUtil';

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
    const claim: Claim = new Claim();
    const flag: ToFlag = new ToFlag();
    const roomBuilder: RoomBuilder = new RoomBuilder();

    this.worksByType = {
      [BUILDER]: [harvest, build, transfer, upgrade],
      [CLAIMER]: [flag,  claim, harvest,  build,  transfer],
      [HARVESTER]: [harvest, transfer, build, upgrade],
      [KILLER]: [attack, flag, harvest, build, transfer, repair, upgrade],
      [REPAIRER]: [harvest, repair, build, transfer, upgrade],
      [ROOM_BUILDER]: [roomBuilder, harvest, build, transfer],
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

    if (this.worksByType[creep.memory.role]) {
      for (const work of this.worksByType[creep.memory.role]) {
        if (work.work(creep)) {
          break;
        }
      }
    }

    if (creep.store.getCapacity(RESOURCE_ENERGY) === creep.store.getFreeCapacity(RESOURCE_ENERGY)) {
      resetMemory(creep);
    }

    if (!creep.memory.working) {
      creep.memory.target = undefined;
    }
  }
}
