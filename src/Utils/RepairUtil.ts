const rate: number = 0.01;

export const isRepairable = (s: Structure) =>  (s.hitsMax * rate) > s.hits;
