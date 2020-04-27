import {ControllerInterface} from './ControllerInterface';
import {
  BUILDER,
  CLAIMER,
  HARVESTER,
  KILLER, MAPPER,
  PICKUP,
  REPAIRER,
  ROOM_BUILDER,
  UNDERTAKER,
  UPGRADER,
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
import {WorkInterface} from '../Works/WorkInterface';
import {resetMemory} from '../Utils/CreepUtil';
import {TransferStorage} from '../Works/TransferStorage';
import {Mapper} from '../Works/Mapper';

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
    const mapper: Mapper = new Mapper();
    const pickUp: Pickup = new Pickup();
    const repair: Repair = new Repair();
    const roomBuilder: RoomBuilder = new RoomBuilder();
    const transfer: TransferEnergy = new TransferEnergy();
    const transferStorage: TransferStorage = new TransferStorage();
    const undertaker: Undertaker = new Undertaker();
    const upgrade: Upgrade = new Upgrade();

    this.worksByType = {
      [BUILDER]: [defense, pickUp, undertaker, harvest, build, transfer, transferStorage, upgrade],
      [CLAIMER]: [defense, flag, claim, pickUp, undertaker, harvest, build, transfer, transferStorage],
      [HARVESTER]: [defense, pickUp, undertaker, harvest, transfer, transferStorage, build, upgrade],
      [KILLER]: [attack, flag, pickUp, undertaker, harvest, transfer, build, transferStorage, repair, upgrade],
      [PICKUP]: [defense, pickUp, undertaker, harvest, repair, build, transfer, transferStorage, upgrade],
      [REPAIRER]: [defense, pickUp, undertaker, harvest, repair, transfer, build, transferStorage, upgrade],
      [ROOM_BUILDER]: [defense, roomBuilder, pickUp, undertaker, harvest, build, transfer, transferStorage],
      [UNDERTAKER]: [defense, undertaker, pickUp, harvest, transfer, transferStorage, build, upgrade],
      [UPGRADER]: [defense, pickUp, undertaker, harvest, upgrade, transfer, transferStorage, build],
      [MAPPER]: [mapper],
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
    let creep: Creep;
    try {
       creep = this.getCreep();
    } catch (e) {
      console.log(`<span style='color:red'>${e.message}</span>`);
      return;
    }

    if (this.worksByType[creep.memory.role]) {
      for (const work of this.worksByType[creep.memory.role]) {
        if (work.work(creep)) {
          break;
        }
      }
    }

    if (creep.store.getFreeCapacity() === 0 && (creep.memory.harvest || creep.memory.undertaker || creep.memory.resource)) {
      resetMemory(creep);
    } else if (creep.store.getFreeCapacity() === creep.store.getCapacity() && !creep.memory.harvest) {
      resetMemory(creep);
    }

    if (!creep.memory.working) {
      creep.memory.target = undefined;
    }
  }
}
