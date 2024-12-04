import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export interface Dispute {
  id: string;
  match_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
  match: {
    player1_id: string;
    player2_id: string;
    tournament_id: string | null;
  };
}

export class DisputeService {
  static async getDisputes(status?: string): Promise<Dispute[]> {
    let query = supabase
      .from('disputes')
      .select(`
        *,
        match:matches(
          player1_id,
          player2_id,
          tournament_id
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async resolveDispute(
    disputeId: string,
    resolution: {
      winnerId: string;
      adminNotes: string;
    }
  ): Promise<void> {
    const { data: dispute, error: disputeError } = await supabase
      .from('disputes')
      .select('*')
      .eq('id', disputeId)
      .single();

    if (disputeError) throw disputeError;

    // Update match result
    const { error: matchError } = await supabase
      .from('matches')
      .update({
        winner_id: resolution.winnerId,
        status: 'completed',
        admin_notes: resolution.adminNotes
      })
      .eq('id', dispute.match_id);

    if (matchError) throw matchError;

    // Update dispute status
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        resolution_notes: resolution.adminNotes
      })
      .eq('id', disputeId);

    if (updateError) throw updateError;

    // Notify users
    await NotificationService.getInstance().createNotification({
      userId: resolution.winnerId,
      title: 'Dispute Resolved',
      message: 'The match dispute has been resolved in your favor.',
      type: 'match_result'
    });
  }

  static async rejectDispute(
    disputeId: string,
    reason: string
  ): Promise<void> {
    const { error: updateError } = await supabase
      .from('disputes')
      .update({
        status: 'rejected',
        resolution_notes: reason
      })
      .eq('id', disputeId);

    if (updateError) throw updateError;

    const { data: dispute } = await supabase
      .from('disputes')
      .select('reported_by')
      .eq('id', disputeId)
      .single();

    await NotificationService.getInstance().createNotification({
      userId: dispute.reported_by,
      title: 'Dispute Rejected',
      message: 'Your match dispute has been rejected.',
      type: 'match_result'
    });
  }
}