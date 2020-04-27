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

  if (!Memory.mapped) {
    Memory.mapped = {};
  }

  if (!Memory.sourcesList || Game.time % POWER_BANK_DECAY === 0) {
    Memory.sourcesList = {};
  }

  if (!Memory.storagesList || Game.time % POWER_BANK_DECAY === 0) {
    Memory.storagesList = {};
  }

  (new RoomVisual()).text(`Creeps = ${Object.keys(Memory.creeps).length}`, 0, 1, {align: 'left'});
  (new RoomVisual()).text(`Rooms = ${Object.keys(Memory.spawns).length}`, 0, 2, {align: 'left'});
  (new RoomVisual()).text(`Room visited = ${Object.keys(Memory.mapped).length}`, 0, 3, {align: 'left'});

  Stat.save();

  for (const key in Memory.mapped) {
    const map = Memory.mapped[key];

    if (map.owner === false && map.sourcesHarvestable >= 2 && map.hasController) {
      console.log(`${key} > ${JSON.stringify(map)}`);
    }
  }

  if (Game.time % 50 === 0 || SpawnController.forceReload) {
    SpawnController.forceReload = false;
    console.log(`Reload game controllers`);
    init();
  }

  objects.forEach(o => o.loop());

  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
