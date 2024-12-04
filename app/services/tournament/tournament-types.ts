export enum TournamentFormat {
  SINGLE_ELIMINATION = 'single_elimination',
  DOUBLE_ELIMINATION = 'double_elimination',
  ROUND_ROBIN = 'round_robin',
  SWISS = 'swiss'
}

export enum TournamentScope {
  PUBLIC = 'public',
  PRIVATE = 'private',
  INVITATIONAL = 'invitational'
}

export interface TournamentRules {
  format: TournamentFormat;
  scope: TournamentScope;
  minRating?: number;
  maxRating?: number;
  bestOf: number;
  timeLimit: number; // minutes
  checkInRequired: boolean;
  checkInWindow: number; // minutes
  allowSubstitutes: boolean;
  prizeDistribution: {
    first: number;
    second: number;
    third: number;
    other?: number;
  };
}

export interface TournamentSettings {
  rules: TournamentRules;
  scheduling: {
    roundInterval: number; // minutes
    matchBuffer: number; // minutes
    timezone: string;
  };
  restrictions?: {
    regionLock?: string[];
    deviceTypes?: string[];
    minGamesPlayed?: number;
    verificationRequired?: boolean;
  };
}