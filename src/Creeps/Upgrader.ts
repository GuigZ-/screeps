import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';

export class Upgrader extends AbstractRole {

  getRole(): string {
    return CreepRoles.UPGRADER;
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
        this.upgrade(creep) || this.transfer(creep) || this.build(creep) || this.repair(creep);
      }
    });

    this.creepNames = creepNames;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [WORK, MOVE];
  }

  creepNeeded(room: Room): number {
    if (!room.controller) {
      return 1;
    }

    return room.controller.level === 1 ? 2 : room.controller.level;
  }
}
