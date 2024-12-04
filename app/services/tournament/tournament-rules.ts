import { TournamentFormat, TournamentScope, TournamentRules } from './tournament-types';

export class TournamentRulesService {
  static validateRules(rules: TournamentRules): string[] {
    const errors: string[] = [];

    if (!Object.values(TournamentFormat).includes(rules.format)) {
      errors.push('Invalid tournament format');
    }

    if (!Object.values(TournamentScope).includes(rules.scope)) {
      errors.push('Invalid tournament scope');
    }

    if (rules.bestOf && (rules.bestOf % 2 === 0 || rules.bestOf < 1)) {
      errors.push('Best of must be an odd number greater than 0');
    }

    if (rules.timeLimit && rules.timeLimit < 5) {
      errors.push('Time limit must be at least 5 minutes');
    }

    if (rules.checkInRequired && !rules.checkInWindow) {
      errors.push('Check-in window must be specified when check-in is required');
    }

    return errors;
  }

  static getDefaultRules(): TournamentRules {
    return {
      format: TournamentFormat.SINGLE_ELIMINATION,
      scope: TournamentScope.PUBLIC,
      bestOf: 3,
      timeLimit: 30,
      checkInRequired: true,
      checkInWindow: 30,
      allowSubstitutes: false,
      prizeDistribution: {
        first: 60,
        second: 30,
        third: 10
      }
    };
  }
}