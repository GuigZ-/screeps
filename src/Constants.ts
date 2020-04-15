type HARVESTER_TYPE = 'harvest';
type UPGRADER_TYPE = 'upgrade';
type BUILDER_TYPE = 'build';
type ATTACK_TYPE = 'attack';
type REPAIR_TYPE = 'repair';
type CLAIM_TYPE = 'claim';
type ROOM_TYPE = 'room';
type UNDERTAKER_TYPE = 'undertaker';
type PICKUP_TYPE = 'pickup';
type VISITOR_TYPE = 'visitor';
export type WORKS = HARVESTER_TYPE | UPGRADER_TYPE | BUILDER_TYPE| ATTACK_TYPE | REPAIR_TYPE | CLAIM_TYPE | ROOM_TYPE | UNDERTAKER_TYPE | PICKUP_TYPE | VISITOR_TYPE;

export const HARVESTER: HARVESTER_TYPE = 'harvest';
export const UPGRADER: UPGRADER_TYPE = 'upgrade';
export const BUILDER: BUILDER_TYPE = 'build';
export const REPAIRER: REPAIR_TYPE = 'repair';
export const KILLER: ATTACK_TYPE = 'attack';
export const ROOM_BUILDER: ROOM_TYPE = 'room';
export const CLAIMER: CLAIM_TYPE = 'claim';
export const UNDERTAKER: UNDERTAKER_TYPE = 'undertaker';
export const PICKUP: PICKUP_TYPE = 'pickup';
export const VISITOR: VISITOR_TYPE = 'visitor';

export type StorageType = StructureSpawn | StructureExtension | StructureTower;
export type Hostiles = Creep | StructureInvaderCore;
export type UndertakerSource =  Tombstone | Ruin | StructureStorage;

export type StatType = Array<{progress: number, date: string, last: number, timeToUp: number, level: number}>;
