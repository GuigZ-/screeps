interface SpawnMemory {
  creeps: string[],
  stats: import('./Constants').StatType
}

interface FlagMemory {
  visitor?: Id<Creep>,
  claim ?: boolean
}

interface CreepMemory {
  attack?: boolean;
  build?: boolean;
  claim?: boolean;
  claimPos: RoomPosition;
  flag?: string;
  fromRoom?: string;
  harvest?: boolean;
  map?: boolean;
  mapMoveTo?: Array<{ exit: ExitConstant, room: string }>;
  mapRoom?: string;
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
  visitorFlag?: string;
  wall_build?: boolean;
  working?: boolean;
}

interface Memory {
  uuid: number;
  log: any;
  stats: import('./Constants').StatType;
  pathMemory: Array<{from: string, to: RoomPosition, path: number}>;
  invaders: {[p: string]: {name: string, date: string, pos: RoomPosition}};
  mapped: {[p: string]: {tick: number, powerBank: boolean, owner: boolean, sources: number, isBuildable?: boolean, sourcesHarvestable: number, hasController: boolean}};
  sourcesList: {[roomName: string]: Id<Source>[]};
  storagesList: {[roomName: string]: Id<import('./Constants').StorageType>[]};
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}
