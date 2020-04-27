import {MAPPER, ROOM_BUILDER} from '../Constants';

export const resetMemory = (creep: Creep): void => {
  creep.memory.attack = undefined;
  creep.memory.build = undefined;
  creep.memory.claim = undefined;
  creep.memory.flag = undefined;
  creep.memory.harvest = undefined;
  creep.memory.map = undefined;
  creep.memory.resource = undefined;
  creep.memory.room = undefined;
  creep.memory.transfer = undefined;
  creep.memory.transferStorage = undefined;
  creep.memory.undertaker = undefined;
  creep.memory.upgrade = undefined;
  creep.memory.working = undefined;
};

export const workMoveTo = (creep: Creep, work: ScreepsReturnCode, target: { pos: RoomPosition, id: Id<any> }): boolean => {
  if (work === ERR_NOT_IN_RANGE || work === OK) {
    if (work === ERR_NOT_IN_RANGE && !moveTo(creep, target)) {

      return false;
    }

    creep.memory.working = true;
    creep.memory.target = target.id;

    return true;
  }

  return false;
};

export const moveTo = (creep: Creep, target: { pos: RoomPosition }, opts: MoveToOpts | undefined = undefined): boolean => {
  const moveTo: ScreepsReturnCode = creep.moveTo(target, opts);
  return moveTo === OK || moveTo === ERR_TIRED;
};
