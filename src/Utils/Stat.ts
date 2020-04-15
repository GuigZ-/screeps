import {StatType} from '../Constants';

export class Stat {
  public static save(): void {
    const d: Date = new Date();

    const lastD: Date = new Date(Memory.stats && Memory.stats.length ? Memory.stats[0].date : d.getDate() - 1);

    if (d.getUTCHours() === lastD.getUTCHours()) {
      return;
    }

    const date: string = `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;

    if (!Memory.stats || Memory.stats.length === 0 || Memory.stats[0].level !== Game.gcl.level) {
      Memory.stats = [];
    }

    Stat.switch(Memory.stats);

    let lastHours: number = 0;

    for (const key in Game.spawns) {
      const spawn: StructureSpawn = Game.spawns[key];

      if (!spawn.room.controller) {
        continue;
      }

      if (!spawn.memory.stats || spawn.memory.stats.length === 0 || spawn.memory.stats[0].level !== spawn.room.controller.level) {
        spawn.memory.stats = [];
      }

      const progress: number = spawn.room.controller.progress;

      Stat.switch(spawn.memory.stats);

      const lastHour = spawn.memory.stats.length >= 1 ? progress - spawn.memory.stats[1].progress : 0;
      const missing: number = spawn.room.controller.progressTotal - progress;

      lastHours += lastHour;

      spawn.memory.stats[0] = {
        date,
        last: lastHour,
        progress,
        timeToUp: missing / lastHour,
        level: spawn.room.controller.level
      };
    }

    Memory.stats[0] = {
      date,
      last: lastHours,
      progress: Game.gcl.progress,
      timeToUp: (Game.gcl.progressTotal - Game.gcl.progress) / lastHours,
      level: Game.gcl.level
    };
  }

  private static switch(stat: StatType): void {
    for (let i = 23; i > 0; i--) {
      if (stat.length >= i) {
        stat[i] = stat[i - 1];
      }
    }
  }
}
