import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';
import { WalletService } from '../wallet-service';

export class ChallengeManager {
    static async sendChallenge(params: {
        challengerId: string;
        opponentId: string;
        gameType: string;
        entryFee: number;
    }): Promise<void> {
        const { error } = await supabase
            .from('challenges')
            .insert([{
                challenger_id: params.challengerId,
                opponent_id: params.opponentId,
                game_type: params.gameType,
                entry_fee: params.entryFee,
                status: 'pending'
            }]);

        if (error) throw error;

        // Send notification to opponent
        await NotificationService.getInstance().createNotification({
            userId: params.opponentId,
            title: 'New Challenge',
            message: `You have been challenged to a ${params.gameType} match for $${params.entryFee}`,
            type: 'match_invite'
        });
    }

    static async acceptChallenge(challengeId: string): Promise<void> {
        const { data: challenge, error: challengeError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', challengeId)
            .single();

        if (challengeError) throw challengeError;

        // Create match
        const { data: match, error: matchError } = await supabase
            .from('matches')
            .insert([{
                player1_id: challenge.challenger_id,
                player2_id: challenge.opponent_id,
                game_type: challenge.game_type,
                entry_fee: challenge.entry_fee,
                status: 'scheduled'
            }])
            .select()
            .single();

        if (matchError) throw matchError;

        // Process entry fees
        await Promise.all([
            WalletService.processEntryFee(challenge.challenger_id, match.id, challenge.entry_fee),
            WalletService.processEntryFee(challenge.opponent_id, match.id, challenge.entry_fee)
        ]);

        // Update challenge status
        const { error: updateError } = await supabase
            .from('challenges')
            .update({ status: 'accepted' })
            .eq('id', challengeId);

        if (updateError) throw updateError;
    }

    static async declineChallenge(challengeId: string): Promise<void> {
        const { error } = await supabase
            .from('challenges')
            .update({ status: 'declined' })
            .eq('id', challengeId);

        if (error) throw error;
    }
}