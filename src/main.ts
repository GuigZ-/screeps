import {ErrorMapper} from 'Utils/ErrorMapper';
import {SpawnController} from './Controller/SpawnController';
import {CreepController} from './Controller/CreepController';
import {ControllerInterface} from './Controller/ControllerInterface';
import {TowerController} from './Controller/TowerController';
import {Stat} from './Utils/Stat';

let objects: ControllerInterface[];

function init() {
  objects = [];

  for (const key in Game.spawns) {
    const spawn: StructureSpawn = Game.spawns[key];

    if (spawn && spawn.my) {
      objects.push(new SpawnController(key));
    }
  }

  for (const key in Game.creeps) {
    const creep: Creep = Game.creeps[key];

    if (creep && creep.my) {
      objects.push(new CreepController(key));
    }
  }

  for (const key in Game.structures) {
    const structure: Structure = Game.structures[key];

    if (structure && structure instanceof StructureTower && structure.my) {
      objects.push(new TowerController(key));
    }
  }
}

console.log(`Restart game`);

init();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  console.log(`Current game tick is ${Game.time}`);

  Stat.save();

  if (Game.time % 50 === 0 || SpawnController.forceReload) {
    SpawnController.forceReload = false;
    console.log(`Reload game controllers`);
    init();
  }

  objects.forEach(o => o.loop());

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
