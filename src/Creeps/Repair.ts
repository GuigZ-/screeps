import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';

export class Repair extends AbstractRole {
  constructor() {
    super();
  }

  getRole(): string {
    return CreepRoles.REPAIR;
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
        this.transfer(creep) || this.repair(creep) || this.upgrade(creep) || this.build(creep);
      }
    });

    this.creepNames = creepNames;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [WORK, MOVE];
  }

  creepNeeded(room: Room): number {
    return Math.floor(room.controller ? room.controller.level / 2 : 1);
  }
}
