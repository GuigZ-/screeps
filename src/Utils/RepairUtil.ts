const rate: number = 0.01;
const stopRate: number = 0.05;

export const isRepairable = (s: Structure): boolean => {
  if (s.structureType === STRUCTURE_ROAD) {
    return (s.hitsMax * 0.1) > s.hits;
  }

  return (s.hitsMax * rate) > s.hits;
};

export const stopRepair = (s: Structure): boolean => {
  if (s.structureType === STRUCTURE_ROAD) {
    return (s.hitsMax * 0.5) > s.hits;
  }

  return (s.hitsMax * stopRate) > s.hits;
};
