import {Harvester} from '../Creeps/Harvester';
import {CreepRoleInterface} from '../Creeps/CreepRoleInterface';
import {Upgrader} from '../Creeps/Upgrader';
import {Builder} from '../Creeps/Builder';
import {Repair} from '../Creeps/Repair';
import {Visitor} from '../Creeps/Visitor';
import {Attack} from '../Creeps/Attack';
import {WallBuilder} from '../Creeps/WallBuilder';

export class RoleController {
  private readonly roomName: string;
  private readonly creepRoles: CreepRoleInterface[];
  private newCreeps: string[] = [];

  constructor(roomName: string) {
    this.roomName = roomName;

    this.creepRoles = [
      new Visitor(),
      new Attack(),
      new Harvester(),
      new Builder(),
      new Upgrader(),
      new Repair(),
      new WallBuilder(),
    ];

    this.initCreeps();
  }

  private initCreeps() {
    Game.rooms[this.roomName].find(FIND_MY_CREEPS).forEach((creep: Creep) => {
      this.build(creep);
    });
  }

  public loop(): void {
    if (this.newCreeps.length > 0) {
      const newCreeps: string[] = [];
      this.newCreeps.forEach((creepName: string) => {
        if (!Game.creeps[creepName] || Game.creeps[creepName].spawning) {
          newCreeps.push(creepName);
        }
      });

      if (this.newCreeps.length !== newCreeps.length) {
        this.initCreeps();
        this.newCreeps = newCreeps;
      }
    }

    this.create();

    this.creepRoles.forEach((role: CreepRoleInterface) => {
      role.move();
    });
  }

  private build(creep: Creep): void {
    this.creepRoles.forEach((role: CreepRoleInterface) => {
      role.addCreep(creep);
    });
  }

  private create(): void {
    let name: string | undefined;
    for (const creepRole in this.creepRoles) {
      const r = this.creepRoles[creepRole];
      name = r.manage(this.roomName);

      if (name) {
        console.log(`New ${name}`);
        this.newCreeps.push(name);
        break;
      }
    }
  }
}
