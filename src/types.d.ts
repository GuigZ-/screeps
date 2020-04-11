interface SpawnMemory {
  creeps: string[],
  stats: Array<{progress: number, date: string, last: number}>
}

interface CreepMemory {
  attack: boolean;
  build: boolean;
  claim: boolean;
  claimPos: RoomPosition;
  flag?: string;
  visitorFlag?: string;
  harvest: boolean;
  renew: boolean;
  repair: boolean;
  resource: boolean;
  role: import('./Constants').WORKS;
  room?: string;
  source?: Source
  spawnName: string;
  target?: Id<any>;
  transfer: boolean;
  undertaker: boolean;
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
