import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';

export class TowerController implements ControllerInterface {
  private readonly towerName: string;

  constructor(creep: string) {
    this.towerName = creep;
  }

  loop(): void {
    const tower: StructureTower = this.getTower();
    this.attack(tower) || tower.store.getFreeCapacity(RESOURCE_ENERGY) > (tower.store.getCapacity(RESOURCE_ENERGY) / 2) || this.repair(
      tower);
    // TODO: repair
  }

  private attack(tower: StructureTower): boolean {
    const hostiles: (Creep | StructureInvaderCore)[] = PositionUtil.closestHostiles(tower.pos);

    if (hostiles.length === 0) {
      return false;
    }

    const target: (Creep | StructureInvaderCore) = hostiles[0];

    if (target instanceof StructureInvaderCore) {
      return false;
    }

    tower.attack(target);
    return true;
  }

  private repair(tower: StructureTower): boolean {
    const ownedStructures: AnyStructure[] = PositionUtil.closestStructureToRepair(tower.pos);
    if (ownedStructures.length === 0) {
      return false;
    }

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
