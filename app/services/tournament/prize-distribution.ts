import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export class PrizeDistributionService {
  static async distributePrizes(tournamentId: string): Promise<void> {
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) throw tournamentError;

    const winners = await this.determineTournamentWinners(tournamentId);
    const prizeDistribution = this.calculatePrizeDistribution(
      tournament.prize_pool,
      tournament.rules?.prizeDistribution
    );

    await supabase.rpc('distribute_tournament_prizes', {
      p_tournament_id: tournamentId,
      p_winners: winners,
      p_prize_distribution: prizeDistribution
    });

    // Notify winners
    await Promise.all(winners.map((winner, index) => 
      NotificationService.getInstance().createNotification({
        userId: winner,
        title: 'Tournament Prize',
        message: `Congratulations! You've won ${prizeDistribution[index]} in the tournament.`,
        type: 'prize_won'
      })
    ));
  }

  private static async determineTournamentWinners(tournamentId: string): Promise<string[]> {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', 'final')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const finalMatch = matches[0];
    const semifinalMatches = await this.getSemifinalMatches(tournamentId);

    return [
      finalMatch.winner_id,
      finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id,
      ...this.determineThirdPlace(semifinalMatches)
    ];
  }

  private static async getSemifinalMatches(tournamentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .eq('round', 'semifinal');

    if (error) throw error;
    return data;
  }

  private static determineThirdPlace(semifinalMatches: any[]): string[] {
    return semifinalMatches
      .map(match => match.winner_id === match.player1_id ? match.player2_id : match.player1_id)
      .slice(0, 1);
  }

  private static calculatePrizeDistribution(totalPrize: number, distribution: any = null): number[] {
    const defaultDistribution = {
      first: 60,
      second: 30,
      third: 10
    };

    const dist = distribution || defaultDistribution;

    return [
      (totalPrize * dist.first) / 100,
      (totalPrize * dist.second) / 100,
      (totalPrize * dist.third) / 100
    ];
  }
}