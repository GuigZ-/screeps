import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';
import {PositionUtil} from '../utils/PositionUtil';

export class Builder extends AbstractRole {

  getRole(): string {
    return CreepRoles.BUILDER;
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
        this.build(creep) || this.transfer(creep) || this.repair(creep) || this.wallBuild(creep) || this.upgrade(creep);
      }
    });

    this.creepNames = creepNames;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [MOVE, WORK];
  }

  creepNeeded(room: Room): number {
    if (!room.controller) {
      return 0;
    }

    return room.controller.level;
  }
}
