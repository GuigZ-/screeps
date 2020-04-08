interface SpawnMemory {
  creeps: string[]
}

interface CreepMemory {
  attack: boolean;
  build: boolean;
  claim: boolean;
  claimPos: RoomPosition;
  flag: string;
  harvest: boolean;
  renew: boolean;
  repair: boolean;
  role: import('./Constants').WORKS;
  room: string;
  source: Source | undefined
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
