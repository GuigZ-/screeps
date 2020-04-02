export class PositionUtil {
  public static closestSources(pos: RoomPosition): Source[] {
    const allSources: Source[] = pos.findInRange(FIND_SOURCES, 50);
    return _.sortBy(allSources, s => pos.getRangeTo(s));
  }
}
