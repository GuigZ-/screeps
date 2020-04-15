import {ControllerInterface} from './ControllerInterface';
import {
  BUILDER,
  CLAIMER,
  HARVESTER,
  KILLER,
  PICKUP,
  REPAIRER,
  ROOM_BUILDER,
  UNDERTAKER,
  UPGRADER,
  VISITOR
} from '../Constants';
import {Attack} from '../Works/Attack';
import {Build} from '../Works/Build';
import {Claim} from '../Works/Claim';
import {Defense} from '../Works/Defense';
import {Harvest} from '../Works/Harvest';
import {Pickup} from '../Works/Pickup';
import {Repair} from '../Works/Repair';
import {RoomBuilder} from '../Works/RoomBuilder';
import {SpawnController} from './SpawnController';
import {ToFlag} from '../Works/ToFlag';
import {TransferEnergy} from '../Works/TransferEnergy';
import {Undertaker} from '../Works/Undertaker';
import {Upgrade} from '../Works/Upgrade';
import {Visitor} from '../Works/Visitor';
import {WorkInterface} from '../Works/WorkInterface';
import {resetMemory} from '../Utils/CreepUtil';
import {TransferStorage} from '../Works/TransferStorage';

export class CreepController implements ControllerInterface {
  private readonly creepName: string;
  private worksByType: { [p: string]: WorkInterface[] };

  constructor(creep: string) {
    this.creepName = creep;

    const attack: Attack = new Attack();
    const build: Build = new Build();
    const claim: Claim = new Claim();
    const defense: Defense = new Defense();
    const flag: ToFlag = new ToFlag();
    const harvest: Harvest = new Harvest();
    const pickUp: Pickup = new Pickup();
    const repair: Repair = new Repair();
    const roomBuilder: RoomBuilder = new RoomBuilder();
    const transfer: TransferEnergy = new TransferEnergy();
    const transferStorage: TransferStorage = new TransferStorage();
    const undertaker: Undertaker = new Undertaker();
    const upgrade: Upgrade = new Upgrade();
    const visitor: Visitor = new Visitor();

    this.worksByType = {
      [BUILDER]: [defense, pickUp, undertaker, harvest, build, transfer, transferStorage, upgrade],
      [CLAIMER]: [defense, flag, claim, pickUp, undertaker, harvest, build, transfer, transferStorage],
      [HARVESTER]: [defense, pickUp, undertaker, harvest, transfer, transferStorage, build, upgrade],
      [KILLER]: [attack, flag, pickUp, undertaker, harvest, build, transfer, transferStorage, repair, upgrade],
      [PICKUP]: [defense, pickUp, undertaker, harvest, repair, build, transfer, transferStorage, upgrade],
      [REPAIRER]: [defense, pickUp, undertaker, harvest, repair, build, transfer, transferStorage, upgrade],
      [ROOM_BUILDER]: [defense, roomBuilder, pickUp, undertaker, harvest, build, transfer, transferStorage],
      [UNDERTAKER]: [defense, undertaker, pickUp, harvest, transfer, transferStorage, build, upgrade],
      [UPGRADER]: [defense, pickUp, undertaker, harvest, upgrade, transfer, transferStorage, build],
      [VISITOR]: [defense, visitor],
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

    if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === 0 && (creep.memory.harvest || creep.memory.undertaker || creep.memory.resource)) {
      resetMemory(creep);
    } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) === creep.store.getCapacity(RESOURCE_ENERGY) && !creep.memory.harvest) {
      resetMemory(creep);
    }

    if (!creep.memory.working) {
      creep.memory.target = undefined;
    }
  }
}
