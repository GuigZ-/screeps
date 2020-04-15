const rate: number = 0.01;

export const isRepairable = (s: Structure) => {
  if (s.structureType === STRUCTURE_ROAD) {
    return (s.hitsMax * 0.1) > s.hits;
  }

  return (s.hitsMax * rate) > s.hits;
};
