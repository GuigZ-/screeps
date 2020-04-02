import {BUILDER, HARVESTER, UPGRADER, WORKS} from './Constants';

export class CreepCreator {
  private static defaultBody: BodyPartConstant[] = [MOVE, CARRY, WORK];

  private static buildName(spawn: StructureSpawn, work: WORKS, counter: number = 0): string {
    return `${spawn.room.name}_${work}_${counter}`;
  }

  public static build(spawn: StructureSpawn, work: WORKS): void {
    const bodyPartNumber: number = 50;
    const bodyBasePart: number = CreepCreator.defaultBody.length;
    const freePart: number = bodyPartNumber - bodyBasePart;

    let bodyPartRequired: any[] = [];

    switch (work) {
      case HARVESTER:
      case UPGRADER:
        bodyPartRequired = [
          {body: CARRY, value: 45},
          {body: WORK, value: 45},
          {body: MOVE, value: 10}
        ];
        break;
      case BUILDER:
        bodyPartRequired = [
          {body: CARRY, value: 40},
          {body: WORK, value: 40},
          {body: MOVE, value: 20}
        ];
        break;
      default:
        throw new Error(`No creeps work found.`);
    }

    let bodyPart: BodyPartConstant[] = [];

    for (let i = freePart; i > 0; i--) {
      bodyPart = [];

      for (const k in bodyPartRequired) {
        const row: { body: BodyPartConstant, value: number } = bodyPartRequired[k];
        const bodyPartCounter: number = i * (row.value / 100);

        for (let j = 0; j < bodyPartCounter; j++) {
          bodyPart.push(row.body);
        }
      }

      let spawnCreep: ScreepsReturnCode;
      let counter: number = 0;
      let creepName: string;

      do {
        creepName = CreepCreator.buildName(spawn, work, counter);
        spawnCreep = spawn.spawnCreep(
          bodyPart,
          creepName,
          // @ts-ignore
          {memory: {role: work, spawnName: spawn.name}}
        );
        counter++;
      } while (spawnCreep === ERR_NAME_EXISTS);

      if (spawnCreep === OK) {
        if (!spawn.memory.creeps) {
          spawn.memory.creeps = [];
        }

        spawn.memory.creeps.push(creepName);
        break;
      }
    }
  }
}
