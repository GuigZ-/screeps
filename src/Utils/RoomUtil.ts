export interface Cardinality { W: number, N: number }

export class RoomUtil {
  public static getCardinality(roomName: string): Cardinality {
    const regexp = /^W([0-9]+)N([0-9]+)$/;
    const roomMatch: RegExpMatchArray | null = roomName.match(regexp);

    if (roomMatch === null || roomMatch.length === 0) {
      throw new Error(`Cardinality not found "${roomName}" ${roomMatch}`);
    }

    return {W: parseInt(roomMatch[1]), N: parseInt(roomMatch[2])};
  }

  public static isNearestRoom(firstRoomName: string, secondRoomName: string, log: boolean = false): boolean {
    if (firstRoomName === 'sim' || secondRoomName === 'sim') {
      return true;
    }

    const firstCardinality: Cardinality = RoomUtil.getCardinality(firstRoomName);
    const secondCardinality: Cardinality = RoomUtil.getCardinality(secondRoomName);

    if (firstCardinality.N <= secondCardinality.N + 1 && firstCardinality.N >= secondCardinality.N - 1 && firstCardinality.W === secondCardinality.W) {
      return true;
    }

    if (firstCardinality.W <= secondCardinality.W + 1 && firstCardinality.W >= secondCardinality.W - 1 && firstCardinality.N === secondCardinality.N) {

      return true;
    }


    return false;
  }
}
