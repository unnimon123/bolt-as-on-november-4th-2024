import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export interface UserReport {
  id: string;
  reported_user_id: string;
  reported_by: string;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
}

export class ModerationService {
  static async getUserReports(status?: string): Promise<UserReport[]> {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        reported_user:profiles!reported_user_id(username),
        reporter:profiles!reported_by(username)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async suspendUser(
    userId: string,
    reason: string,
    duration: number
  ): Promise<void> {
    const suspensionEnd = new Date();
    suspensionEnd.setDate(suspensionEnd.getDate() + duration);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspension_reason: reason,
        suspension_end: suspensionEnd.toISOString()
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    await NotificationService.getInstance().createNotification({
      userId,
      title: 'Account Suspended',
      message: `Your account has been suspended for ${duration} days: ${reason}`,
      type: 'account_status'
    });
  }

  static async unsuspendUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspension_end: null
      })
      .eq('id', userId);

    if (error) throw error;

    await NotificationService.getInstance().createNotification({
      userId,
      title: 'Account Restored',
      message: 'Your account suspension has been lifted.',
      type: 'account_status'
    });
  }

  static async resolveReport(
    reportId: string,
    resolution: {
      action: 'suspend' | 'warn' | 'dismiss';
      notes: string;
    }
  ): Promise<void> {
    const { data: report } = await supabase
      .from('user_reports')
      .select('reported_user_id')
      .eq('id', reportId)
      .single();

    if (resolution.action === 'suspend') {
      await this.suspendUser(report.reported_user_id, resolution.notes, 7);
    } else if (resolution.action === 'warn') {
      await NotificationService.getInstance().createNotification({
        userId: report.reported_user_id,
        title: 'Warning',
        message: resolution.notes,
        type: 'account_status'
      });
    }

    const { error } = await supabase
      .from('user_reports')
      .update({
        status: 'resolved',
        resolution_notes: resolution.notes,
        resolution_action: resolution.action
      })
      .eq('id', reportId);

    if (error) throw error;
  }
}