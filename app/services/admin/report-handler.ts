import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export interface Report {
  id: string;
  type: 'match_dispute' | 'user_behavior' | 'technical_issue';
  reporterId: string;
  targetId: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
}

export class ReportHandler {
  static async submitReport(report: Partial<Report>): Promise<Report> {
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        ...report,
        status: 'pending',
        priority: this.calculatePriority(report)
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateReportStatus(
    reportId: string,
    status: Report['status'],
    resolution?: string
  ): Promise<void> {
    const { data: report, error: fetchError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status,
        resolution,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      })
      .eq('id', reportId);

    if (updateError) throw updateError;

    // Notify users
    await NotificationService.getInstance().createNotification({
      userId: report.reporterId,
      title: 'Report Update',
      message: `Your report has been ${status}`,
      type: 'report_update'
    });
  }

  private static calculatePriority(report: Partial<Report>): Report['priority'] {
    // Implement priority calculation logic based on report type and content
    if (report.type === 'match_dispute') return 'high';
    if (report.type === 'user_behavior') return 'medium';
    return 'low';
  }

  static async getReports(filters?: {
    status?: Report['status'];
    type?: Report['type'];
    priority?: Report['priority'];
  }): Promise<Report[]> {
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reporter_id(username),
        target:profiles!target_id(username)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.priority) {
      query = query.eq('priority', filters.priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}