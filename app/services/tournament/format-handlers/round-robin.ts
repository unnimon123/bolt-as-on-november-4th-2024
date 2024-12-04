import { supabase } from '../../supabase';

export class RoundRobinHandler {
  static async generateSchedule(tournamentId: string): Promise<void> {
    const { data: participants } = await supabase
      .from('tournament_participants')
      .select('player_id')
      .eq('tournament_id', tournamentId);

    if (!participants) return;

    const players = participants.map(p => p.player_id);
    const rounds = this.generateRoundRobinPairings(players);

    // Create matches for each round
    for (let roundIndex = 0; roundIndex < rounds.length; roundIndex++) {
      const round = rounds[roundIndex];
      
      await Promise.all(round.map(pair =>
        supabase.from('matches').insert({
          tournament_id: tournamentId,
          round: roundIndex + 1,
          player1_id: pair[0],
          player2_id: pair[1],
          status: 'scheduled'
        })
      ));
    }
  }

  private static generateRoundRobinPairings(players: string[]): [string, string][][] {
    const n = players.length;
    const rounds: [string, string][][] = [];
    const playersCopy = [...players];

    // If odd number of players, add a bye
    if (n % 2 === 1) {
      playersCopy.push('bye');
    }

    const numRounds = playersCopy.length - 1;
    const numPairs = playersCopy.length / 2;

    for (let round = 0; round < numRounds; round++) {
      const roundPairings: [string, string][] = [];

      for (let pair = 0; pair < numPairs; pair++) {
        const player1 = playersCopy[pair];
        const player2 = playersCopy[playersCopy.length - 1 - pair];

        if (player1 !== 'bye' && player2 !== 'bye') {
          roundPairings.push([player1, player2]);
        }
      }

      rounds.push(roundPairings);

      // Rotate players (keep first player fixed)
      playersCopy.splice(1, 0, playersCopy.pop()!);
    }

    return rounds;
  }
}