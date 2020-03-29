import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';
import {PositionUtil} from '../utils/PositionUtil';

export class WallBuilder extends AbstractRole {

  getRole(): string {
    return CreepRoles.WALL_BUILDER;
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
        this.wallBuild(creep) || this.build(creep) || this.transfer(creep) || this.upgrade(creep);
      }
    });

    this.creepNames = creepNames;
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [MOVE, WORK];
  }

  creepNeeded(room: Room): number {
    if (!room.controller || room.controller.level <= 3) {
      return 0;
    }

    return 3;
  }
}
