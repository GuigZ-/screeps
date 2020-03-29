import {ErrorMapper} from 'utils/ErrorMapper';
import {RoomController} from './Controller/RoomController';

let rooms: RoomController[] = [];


function init() {
  Object.keys(Game.rooms).forEach((roomName: string) => {
    rooms.push(new RoomController(roomName));
  });

  console.log(`Reload`);
}

init();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  if (Game.time % 50 === 0) {
    rooms = [];
    init();
  }

  rooms.forEach((roomController: RoomController) => {
    roomController.loop();
  });

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
