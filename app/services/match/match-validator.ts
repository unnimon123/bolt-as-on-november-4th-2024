import { supabase } from '../supabase';

export class MatchValidator {
  static async validateResult(matchId: string, result: {
    player1Score: number;
    player2Score: number;
    winnerId: string;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    // Get match details
    const { data: match, error } = await supabase
      .from('matches')
      .select(`
        *,
        player1:profiles!player1_id(username),
        player2:profiles!player2_id(username)
      `)
      .eq('id', matchId)
      .single();

    if (error || !match) {
      errors.push('Match not found');
      return { valid: false, errors };
    }

    // Validate scores
    if (result.player1Score === result.player2Score) {
      errors.push('Scores cannot be equal');
    }

    // Validate winner
    const actualWinner = result.player1Score > result.player2Score ? 
      match.player1_id : match.player2_id;
    
    if (result.winnerId !== actualWinner) {
      errors.push('Winner does not match scores');
    }

    // Validate submission timeframe
    const matchTime = new Date(match.scheduled_time);
    const now = new Date();
    const timeDiff = now.getTime() - matchTime.getTime();
    
    if (timeDiff < -300000) { // 5 minutes before scheduled time
      errors.push('Match has not started yet');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}