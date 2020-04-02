interface SpawnMemory {
  creeps: string[]
}

interface CreepMemory {
  build: boolean;
  harvest: boolean;
  repair: boolean;
  role: import('./Constants').WORKS;
  room: string;
  renew: boolean;
  spawnName: string;
  target: Id<any> | undefined;
  transfer: boolean;
  upgrade: boolean;
  wall_build: boolean;
  working: boolean;
}

interface Memory {
  uuid: number;
  log: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
