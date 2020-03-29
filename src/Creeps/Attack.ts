import {CreepRoles} from './CreepRoles';
import {AbstractRole} from './AbstractRole';
import {PositionUtil} from '../utils/PositionUtil';

export class Attack extends AbstractRole {

  getRole(): string {
    return CreepRoles.ATTACK;
  }

  move(): void {
    const creepNames: string[] = [];

    this.creepNames.forEach((creepName: string) => {
      this.byRooms = 1;
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

      return;
    });
  }

  protected getBodyPart(): BodyPartConstant[] {
    return [MOVE, ATTACK, ATTACK];
  }

  creepNeeded(room: Room): number {
    if (!room.controller || room.controller.level <= 3) {
      return 0;
    }

    return 1;
  }
}
