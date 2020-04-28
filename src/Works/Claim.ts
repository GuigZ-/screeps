import {resetMemory, workMoveTo} from '../Utils/CreepUtil';
import {WorkInterface} from './WorkInterface';

export class Claim implements WorkInterface {
  public work(creep: Creep): boolean {
    if (!Claim.can(creep)) {
      return false;
    }

    console.log(`Claim ${creep.pos}`);

    resetMemory(creep);

    const controllers: StructureController[] = Claim.getConstructionSites(creep);

    for (const controller of controllers) {
      let action: CreepActionReturnCode | ERR_FULL | ERR_GCL_NOT_ENOUGH;

      if (controller.reservation && controller.reservation.ticksToEnd) {
        action = creep.attackController(controller);
      } else {
        action = creep.claimController(controller);
      }

      if (workMoveTo(creep, action, controller)) {
        creep.memory.claim = true;
        return true;
      }
    }

    resetMemory(creep);

    return false;
  }

  private static can(creep: Creep): boolean {
    if (creep.memory.working && !creep.memory.claim) {
      return false;
    }

    return !(!creep.room.controller || creep.room.controller.owner);
  }

  private static getConstructionSites(creep: Creep): StructureController[] {
    const controllers: StructureController[] = [];

    if (creep.memory.target) {
      const target: RoomObject = Game.getObjectById(creep.memory.target);

      if (target instanceof StructureController && !target.my) {
        controllers.push(target);
      }
    }

    if (creep.room.controller) {
      controllers.push(creep.room.controller);
    }

    return controllers;
  }
}
