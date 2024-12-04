import { supabase } from '../supabase';

export interface DashboardMetrics {
  totalUsers: number;
  activeTournaments: number;
  totalRevenue: number;
  disputeRate: number;
  userGrowth: { date: string; count: number }[];
  revenueByDay: { date: string; amount: number }[];
}

export class AnalyticsDashboard {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
      usersCount,
      tournamentsCount,
      revenue,
      disputes,
      userGrowth,
      revenueData
    ] = await Promise.all([
      this.getTotalUsers(),
      this.getActiveTournaments(),
      this.getTotalRevenue(),
      this.getDisputeRate(),
      this.getUserGrowth(),
      this.getRevenueByDay()
    ]);

    return {
      totalUsers: usersCount,
      activeTournaments: tournamentsCount,
      totalRevenue: revenue,
      disputeRate: disputes,
      userGrowth,
      revenueByDay: revenueData
    };
  }

  private static async getTotalUsers(): Promise<number> {
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    return count || 0;
  }

  private static async getActiveTournaments(): Promise<number> {
    const { count } = await supabase
      .from('tournaments')
      .select('*', { count: 'exact' })
      .eq('status', 'in_progress');
    return count || 0;
  }

  private static async getTotalRevenue(): Promise<number> {
    const { data } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'platform_fee')
      .eq('status', 'completed');
    
    return data?.reduce((sum, tx) => sum + tx.amount, 0) || 0;
  }

  private static async getDisputeRate(): Promise<number> {
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('status', 'completed');

    const { count: disputedMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact' })
      .eq('status', 'disputed');

    return totalMatches ? (disputedMatches || 0) / totalMatches : 0;
  }

  private static async getUserGrowth(): Promise<{ date: string; count: number }[]> {
    const { data } = await supabase
      .from('profiles')
      .select('created_at')
      .order('created_at', { ascending: true });

    return this.aggregateByDay(data || [], 'created_at');
  }

  private static async getRevenueByDay(): Promise<{ date: string; amount: number }[]> {
    const { data } = await supabase
      .from('transactions')
      .select('amount, created_at')
      .eq('type', 'platform_fee')
      .eq('status', 'completed');

    return this.aggregateByDay(data || [], 'created_at', 'amount');
  }

  private static aggregateByDay(
    data: any[],
    dateField: string,
    valueField?: string
  ): any[] {
    const aggregated = data.reduce((acc, item) => {
      const date = new Date(item[dateField]).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = valueField ? item[valueField] : 1;
      } else {
        acc[date] += valueField ? item[valueField] : 1;
      }
      return acc;
    }, {});

    return Object.entries(aggregated).map(([date, value]) => ({
      date,
      [valueField ? 'amount' : 'count']: value
    }));
  }
}