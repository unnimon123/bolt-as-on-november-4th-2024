import { supabase } from '../supabase';
import { RatingService } from './rating-service';
import { ProfileService } from '../profile-service';

interface MatchResult {
    matchId: string;
    player1Score: number;
    player2Score: number;
    winnerId: string;
}

export class MatchResultService {
    static async submitResult(result: MatchResult): Promise<void> {
        const { data: match, error: matchError } = await supabase
            .from('casual_matches')
            .select('*')
            .eq('id', result.matchId)
            .single();

        if (matchError) throw matchError;

        // Submit result using stored procedure
        const { error: submitError } = await supabase.rpc('submit_casual_match_result', {
            p_match_id: result.matchId,
            p_player1_score: result.player1Score,
            p_player2_score: result.player2Score,
            p_winner_id: result.winnerId
        });

        if (submitError) throw submitError;

        // Update player ratings
        const [player1, player2] = await Promise.all([
            ProfileService.getProfile(match.player1_id),
            ProfileService.getProfile(match.player2_id)
        ]);

        const { player1NewRating, player2NewRating } = RatingService.calculateNewRatings(
            player1.rating,
            player2.rating,
            result.winnerId === player1.id
        );

        await Promise.all([
            ProfileService.updateProfile(player1.id, { rating: player1NewRating }),
            ProfileService.updateProfile(player2.id, { rating: player2NewRating })
        ]);
    }

    static async disputeMatch(matchId: string): Promise<void> {
        const { error } = await supabase
            .from('casual_matches')
            .update({ status: 'disputed' })
            .eq('id', matchId);

        if (error) throw error;
    }
}