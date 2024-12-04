import { supabase } from '../../supabase';
import type { Match } from '../../supabase';

export class SwissTournamentHandler {
  static async generateRound(tournamentId: string, roundNumber: number): Promise<void> {
    const { data: players } = await supabase
      .from('tournament_participants')
      .select(`
        player_id,
        points:matches(
          winner_id,
          player1_id,
          player2_id
        )
      `)
      .eq('tournament_id', tournamentId);

    // Calculate points for each player
    const playerPoints = players?.map(p => ({
      playerId: p.player_id,
      points: this.calculatePoints(p.points),
      opponents: this.getPreviousOpponents(p.points, p.player_id)
    }));

    // Sort players by points
    playerPoints?.sort((a, b) => b.points - a.points);

    // Generate pairings
    const pairings = this.generatePairings(playerPoints || []);

    // Create matches
    await Promise.all(pairings.map(pair =>
      supabase.from('matches').insert({
        tournament_id: tournamentId,
        round: roundNumber,
        player1_id: pair[0],
        player2_id: pair[1],
        status: 'scheduled'
      })
    ));
  }

  private static calculatePoints(matches: any[]): number {
    return matches.reduce((points, match) => {
      if (match.winner_id === match.player1_id) {
        return points + 1;
      }
      return points;
    }, 0);
  }

  private static getPreviousOpponents(matches: any[], playerId: string): string[] {
    return matches.map(match => 
      match.player1_id === playerId ? match.player2_id : match.player1_id
    );
  }

  private static generatePairings(players: any[]): [string, string][] {
    const pairings: [string, string][] = [];
    const used = new Set<string>();

    for (let i = 0; i < players.length; i++) {
      if (used.has(players[i].playerId)) continue;

      // Find best match for current player
      let bestMatch = this.findBestMatch(players[i], players.slice(i + 1), used);
      if (bestMatch) {
        pairings.push([players[i].playerId, bestMatch]);
        used.add(players[i].playerId);
        used.add(bestMatch);
      }
    }

    return pairings;
  }

  private static findBestMatch(player: any, candidates: any[], used: Set<string>): string | null {
    return candidates.find(c => 
      !used.has(c.playerId) && 
      !player.opponents.includes(c.playerId)
    )?.playerId || null;
  }
}