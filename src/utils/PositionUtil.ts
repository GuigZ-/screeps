export class PositionUtil {
  public static buildNearPosition(from: RoomPosition, to: RoomPosition, range: number = 1): RoomPosition | undefined {
    const room: Room = Game.rooms[from.roomName];

    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        const costs = new PathFinder.CostMatrix;

        room.find(FIND_MY_STRUCTURES).forEach((struct: Structure) => {
          if (struct.structureType === STRUCTURE_CONTAINER ||
            (struct.structureType === STRUCTURE_RAMPART &&
              !(struct instanceof OwnedStructure))) {
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });

        return costs;
      }
    };

    const ret = PathFinder.search(
      from, {pos: to, range}, opts
    );

    if (ret.path && ret.path.length >= range) {
      return ret.path[ret.path.length - range];
    }

    return undefined;
  }

  public static pathRoad(from: RoomPosition, to: RoomPosition, range: number = 1): PathFinderPath {
    const room: Room = Game.rooms[from.roomName];

    const opts: PathFinderOpts = {
      roomCallback: (roomName: string): boolean | CostMatrix => {
        const costs = new PathFinder.CostMatrix;

        room.find(FIND_MY_STRUCTURES).forEach((struct: Structure) => {
          if (struct.structureType === STRUCTURE_CONTAINER ||
            (struct.structureType === STRUCTURE_RAMPART &&
              !(struct instanceof OwnedStructure))) {
            costs.set(struct.pos.x, struct.pos.y, 0xff);
          }
        });

        return costs;
      }
    };

    return PathFinder.search(
      from, {pos: to, range}, opts
    );
  }
}
