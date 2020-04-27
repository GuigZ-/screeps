import {moveTo} from '../Utils/CreepUtil';
import {isBuildable} from '../Utils/PositionUtil';
import {WorkInterface} from './WorkInterface';
import {Cardinality, RoomUtil} from '../Utils/RoomUtil';

const shouldBeMapped = (roomName: string): boolean => {
  return !Memory.mapped[roomName] || ((Game.time - Memory.mapped[roomName].tick) > POWER_BANK_DECAY);
};

const isNotRisky = (roomName: string): boolean => {
  return !Memory.mapped[roomName] || !Memory.mapped[roomName].owner;
};

const isHarvestable = (pos: RoomPosition): number => {
  let counter: number = 0;

  for (let i = pos.x - 1; i <= pos.x + 1; i++) {
    if (i < 0 || i > 49) {
      continue;
    }
    for (let j = pos.y - 1; j <= pos.y + 1; j++) {
      if (j < 0 || j > 49) {
        continue;
      }

      if (j === pos.y && i === pos.x) {
        continue;
      }

      counter += isBuildable(new RoomPosition(i, j, pos.roomName)) ? 1 : 0;
    }
  }

  return counter;
};

export class Mapper implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Mapper.can(creep)) {
      return false;
    }

    const cardinality: Cardinality = RoomUtil.getCardinality(creep.pos.roomName);
    let goTo: RoomPosition | null;

    if (creep.memory.mapMoveTo && creep.memory.mapMoveTo.length >= 1 && creep.memory.mapMoveTo[0].room === creep.pos.roomName) {
      creep.memory.mapMoveTo.shift();
    }

    // @ts-ignore
    if (!creep.memory.mapMoveTo || creep.memory.mapMoveTo.length === 0 || (creep.memory.mapRoom && !shouldBeMapped(creep.memory.mapRoom))) {
      let range: number = 1;
      do {
        const closestRooms: RoomPosition[] = [];

        for (let w = Math.max(0, cardinality.W - range); w <= Math.min(10, cardinality.W + range); w++) {
          for (let n = Math.max(0, cardinality.N - range); n <= Math.min(10, cardinality.N + range); n++) {
            if (cardinality.W === w && cardinality.N === n) {
              continue;
            }

            const roomName: string = `W${w}N${n}`;

            if (!Memory.mapped[roomName] || shouldBeMapped(roomName)) {
              closestRooms.push(new RoomPosition(25, 25, roomName));
            }
          }
        }
        range++;

        // console.log(`Rooms => ${JSON.stringify(closestRooms)}`);

        for (const closestRoom of closestRooms) {
          const routes: Array<{ exit: ExitConstant, room: string }> | ERR_NO_PATH = Game.map.findRoute(
            creep.pos.roomName,
            closestRoom.roomName,
            {
              routeCallback: ((roomName) => {
                if (closestRoom.roomName !== roomName && !isNotRisky(roomName)) {
                  return Infinity;
                }

                return 1;
              })
            }
          );

          if (routes === ERR_NO_PATH) {
            continue;
          }

          creep.memory.mapMoveTo = routes;
          creep.memory.mapRoom = closestRoom.roomName;
        }
      } while ((!creep.memory.mapMoveTo || creep.memory.mapMoveTo.length < 1) && range <= 10);

    } else {
      creep.memory.fromRoom = creep.pos.roomName;
    }

    if (!creep.memory.mapMoveTo) {
      return false;
    }

    goTo = Mapper.goToExit(creep, creep.memory.mapMoveTo[0]);

    if (!goTo) {
      return false;
    }

    if (creep.pos.x === 1 || creep.pos.y === 1 || creep.pos.x === 48 || creep.pos.y === 48) {
      if (!Memory.mapped) {
        Memory.mapped = {};
      }

      const data = {
        hasController: false,
        powerBank: false,
        owner: false
      };

      creep.room.find(
        FIND_STRUCTURES
      )
           .forEach(s => {
             if (s.structureType === STRUCTURE_POWER_BANK) {
               data.powerBank = true;
             } else if (s.structureType === STRUCTURE_CONTROLLER) {
               data.hasController = true;
               if (s.owner && !s.my) {
                 data.owner = true;
               }
             }
           });

      const sources = !data.owner ? creep.room.find(FIND_SOURCES) : [];
      Memory.mapped[creep.pos.roomName] = {
        tick: Game.time,
        powerBank: data.powerBank,
        owner: data.owner,
        sources: sources.length,
        sourcesHarvestable: sources.filter(s => isHarvestable(s.pos) >= 4).length,
        hasController: data.hasController
      };
    }

    console.log(`${creep.name} - ${creep.memory.mapMoveTo.length} ${creep.pos} > ${creep.memory.mapRoom} [${JSON.stringify(
      goTo)}]`);

    moveTo(creep, {pos: goTo});

    return true;
  }

  private static can(creep: Creep): boolean {
    return !(creep.memory.working && !creep.memory.map);
  }

  private static goToExit(creep: Creep, nextStep: { exit: ExitConstant, room: string }): RoomPosition | null {
    return creep.pos.findClosestByRange(nextStep.exit);
  }
}
