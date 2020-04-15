interface SpawnMemory {
  creeps: string[],
  stats: import('./Constants').StatType;
}

interface FlagMemory {
  visitor?: Id<Creep>
}

interface CreepMemory {
  attack?: boolean;
  build?: boolean;
  claim?: boolean;
  claimPos: RoomPosition;
  flag?: string;
  visitorFlag?: string;
  harvest?: boolean;
  renew?: boolean;
  repair?: boolean;
  resource?: boolean;
  role: import('./Constants').WORKS;
  room?: string;
  source?: Id<Source>
  spawnName: string;
  target?: Id<any>;
  transfer?: boolean;
  transferStorage?: boolean;
  undertaker?: boolean;
  upgrade?: boolean;
  wall_build?: boolean;
  working?: boolean;
}

interface Memory {
  uuid: number;
  log: any;
  stats: import('./Constants').StatType;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
