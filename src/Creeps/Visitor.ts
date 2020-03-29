import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';

export class Visitor extends AbstractRole {
  constructor() {
    super();
  }

  getRole(): string {
    return CreepRoles.VISITOR;
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
        this.transfer(creep) || this.build(creep) || this.upgrade(creep) || this.repair(creep);
      }
    });

    this.creepNames = creepNames;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [CLAIM];
  }

  creepNeeded(room: Room): number {
    if (!room.controller || room.controller.level <= 3) {
      return 0;
    }

    return 1;
  }
}
