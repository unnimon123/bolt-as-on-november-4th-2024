import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export interface Dispute {
  id: string;
  matchId: string;
  reporterId: string;
  reason: string;
  evidence?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  created_at: string;
}

export class DisputeHandler {
  static async createDispute(dispute: Partial<Dispute>): Promise<Dispute> {
    const { data, error } = await supabase
      .from('disputes')
      .insert([{
        ...dispute,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;

    // Update match status
    await supabase
      .from('matches')
      .update({ status: 'disputed' })
      .eq('id', dispute.matchId);

    // Notify admins
    await NotificationService.getInstance().createNotification({
      userId: 'admin', // Replace with actual admin notification logic
      title: 'New Match Dispute',
      message: `A new dispute has been filed for match ${dispute.matchId}`,
      type: 'match_dispute'
    });

    return data;
  }

  static async resolveDispute(
    disputeId: string,
    resolution: {
      status: 'resolved' | 'rejected';
      winnerId?: string;
      reason: string;
    }
  ): Promise<void> {
    const { data: dispute, error: fetchError } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (fetchError) throw fetchError;

    await supabase.rpc('resolve_dispute', {
      p_dispute_id: disputeId,
      p_status: resolution.status,
      p_winner_id: resolution.winnerId,
      p_reason: resolution.reason
    });

    // Notify involved players
    const { data: match } = await supabase
      .from('matches')
      .select('player1_id, player2_id')
      .eq('id', dispute.matchId)
      .single();

    await Promise.all([
      NotificationService.getInstance().createNotification({
        userId: match.player1_id,
        title: 'Dispute Resolution',
        message: `The dispute for your match has been ${resolution.status}`,
        type: 'match_result'
      }),
      NotificationService.getInstance().createNotification({
        userId: match.player2_id,
        title: 'Dispute Resolution',
        message: `The dispute for your match has been ${resolution.status}`,
        type: 'match_result'
      })
    ]);
  }
}