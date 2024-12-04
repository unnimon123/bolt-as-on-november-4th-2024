import { supabase } from '../supabase';

export class TournamentStatsService {
  static async getTournamentStats(tournamentId: string): Promise<any> {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        matches (
          player1_id,
          player2_id,
          winner_id,
          player1_score,
          player2_score
        ),
        tournament_participants (
          player:profiles(*)
        )
      `)
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    const stats = {
      totalMatches: tournament.matches.length,
      completedMatches: tournament.matches.filter((m: any) => m.winner_id).length,
      totalParticipants: tournament.tournament_participants.length,
      averageScore: this.calculateAverageScore(tournament.matches),
      topPerformers: await this.getTopPerformers(tournamentId),
      winRates: this.calculateWinRates(tournament.matches),
      prizeDistribution: this.calculatePrizeDistribution(tournament)
    };

    return stats;
  }

  private static calculateAverageScore(matches: any[]): number {
    const scores = matches.flatMap(m => [m.player1_score, m.player2_score].filter(Boolean));
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  private static async getTopPerformers(tournamentId: string): Promise<any[]> {
    const { data, error } = await supabase.rpc('get_tournament_top_performers', {
      p_tournament_id: tournamentId
    });

    if (error) throw error;
    return data;
  }

  private static calculateWinRates(matches: any[]): Map<string, number> {
    const playerMatches = new Map<string, { wins: number, total: number }>();
    
    matches.forEach(match => {
      [match.player1_id, match.player2_id].forEach(playerId => {
        if (!playerMatches.has(playerId)) {
          playerMatches.set(playerId, { wins: 0, total: 0 });
        }
        const stats = playerMatches.get(playerId)!;
        stats.total++;
        if (match.winner_id === playerId) {
          stats.wins++;
        }
      });
    });

    const winRates = new Map<string, number>();
    playerMatches.forEach((stats, playerId) => {
      winRates.set(playerId, (stats.wins / stats.total) * 100);
    });

    return winRates;
  }

  private static calculatePrizeDistribution(tournament: any): any {
    const { prize_pool, rules } = tournament;
    const distribution = rules?.prizeDistribution || {
      first: 60,
      second: 30,
      third: 10
    };

    return {
      firstPlace: (prize_pool * distribution.first) / 100,
      secondPlace: (prize_pool * distribution.second) / 100,
      thirdPlace: (prize_pool * distribution.third) / 100
    };
  }
}