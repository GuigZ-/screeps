import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';

export class Harvester extends AbstractRole {

  getRole(): string {
    return CreepRoles.HARVESTER;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [CARRY, WORK, CARRY, WORK, MOVE];
  }

  move(): void {
    const creepNames: string[] = [];

    this.creepNames.forEach((creepName: string) => {
      const creep: Creep = Game.creeps[creepName];

      if (!creep) {
        return;
      }

      creepNames.push(creepName);

      if (this.renew(creep)) {
        return;
      }

      this.initMemoryWork(creep);

      if (!creep.memory.working) {
        this.harvest(creep);
      } else {
        this.transfer(creep) || this.upgrade(creep) || this.build(creep) || this.repair(creep);
      }
    });

    this.creepNames = creepNames;
  }

  creepNeeded(room: Room): number {
    if (!room.controller) {
      return 1;
    }

    return room.controller.level;
  }
}
