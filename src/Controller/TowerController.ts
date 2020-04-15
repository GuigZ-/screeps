import {ControllerInterface} from './ControllerInterface';
import {PositionUtil} from '../Utils/PositionUtil';
import {Hostiles} from '../Constants';

export class TowerController implements ControllerInterface {
  private readonly towerName: string;

  constructor(creep: string) {
    this.towerName = creep;
  }

  loop(): void {
    const tower: StructureTower = this.getTower();
    TowerController.attack(tower) || tower.store.getFreeCapacity(RESOURCE_ENERGY) > (tower.store.getCapacity(RESOURCE_ENERGY) / 2) || TowerController.heal(tower) || TowerController.repair(tower);
  }

  private static attack(tower: StructureTower): boolean {
    const hostiles: Hostiles[] = PositionUtil.closestHostiles(tower.pos);

    if (hostiles.length === 0) {
      return false;
    }

    const target: Hostiles = hostiles[0];

    if (target instanceof StructureInvaderCore) {
      return false;
    }

    tower.attack(target);
    return true;
  }

  private static repair(tower: StructureTower): boolean {
    const ownedStructures: AnyStructure[] = PositionUtil.closestStructureToRepair(tower.pos);
    if (ownedStructures.length === 0) {
      return false;
    }

    tower.repair(ownedStructures[0]);

    return true;
  }

  private static heal(tower: StructureTower): boolean {
    const ownedStructures: AnyCreep[] = tower.pos.findInRange(FIND_MY_CREEPS, 50, {filter:
      c => c.hits !== c.hitsMax
    });

    if (ownedStructures.length === 0) {
      return false;
    }

    tower.heal(ownedStructures[0]);
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
