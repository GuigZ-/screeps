interface SpawnMemory {
  creeps: import('./Creeps/CreepRoleInterface').CreepRoleInterface[];
}

interface CreepMemory {
  build: boolean;
  harvest: boolean;
  number: number;
  repair: boolean;
  role: string;
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
