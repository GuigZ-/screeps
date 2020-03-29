export interface CreepRoleInterface {
  // Déplacement du creep
  move(): void;

  // Role du creep
  getRole(): string;

  // Création d'un nouveau creep
  invoke(spawn: StructureSpawn): string | undefined;

  // Association de l'object avec un nouveau creep
  addCreep(creep: Creep): void;

  // Nombre de creep
  nbCreeps(): number;

  // Manage creeps
  manage(roomName: string): string | undefined;
}
