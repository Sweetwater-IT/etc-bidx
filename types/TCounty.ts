export type County = {
    id: number;
    name: string;
    district: number;
    branch: string;
    laborRate: number;
    fringeRate: number;
    shopRate: number;
    flaggingRate: number;
    flaggingBaseRate: number;
    flaggingFringeRate: number;
    ratedTargetGM: number;
    nonRatedTargetGM: number;
    insurance: number;
    fuel: number;
    market: 'MOBILIZATION' | 'CORE' | 'LOCAL'
  }