import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';

export class TowerController implements ControllerInterface {
  private readonly towerName: string;

  constructor(creep: string) {
    this.towerName = creep;
  }

  loop(): void {
    const tower: StructureTower = this.getTower();
    this.attack(tower) || this.repair(tower);
    // TODO: repair
  }

  private attack(tower: StructureTower): boolean {
    const creeps: Creep[] = PositionUtil.closestHostileCreeps(tower.pos);

    if (creeps.length === 0) {
      return false;
    }

    tower.attack(creeps[0]);
    return true;
  }

  private repair(tower: StructureTower): boolean {
    const ownedStructures: AnyStructure[] = PositionUtil.closestStructureToRepair(tower.pos);
console.log(`repair ${ownedStructures.length}`);
    if (ownedStructures.length === 0) {
      return false;
    }
    console.log(`repair ${ownedStructures[0]}`);

    tower.repair(ownedStructures[0]);
    return true;
  }

  private getTower(): StructureTower {
    const tower: Structure = Game.structures[this.towerName];

    if (!tower || !(tower instanceof StructureTower)) {
      throw new Error(`Tower not exists`);
    }

    return tower;
  }
}
