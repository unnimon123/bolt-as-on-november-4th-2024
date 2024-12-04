import { supabase } from './supabase';

interface DashboardStats {
    activeTournaments: number;
    activeUsers: number;
    pendingDisputes: number;
}

interface ActivityItem {
    icon: string;
    title: string;
    description: string;
    timestamp: string;
}

export class AdminService {
    static async getDashboardStats(): Promise<DashboardStats> {
        try {
            const [
                { count: activeTournaments },
                { count: activeUsers },
                { count: pendingDisputes }
            ] = await Promise.all([
                supabase
                    .from('tournaments')
                    .select('id', { count: 'exact' })
                    .eq('status', 'in_progress'),
                supabase
                    .from('profiles')
                    .select('id', { count: 'exact' })
                    .eq('is_online', true),
                supabase
                    .from('matches')
                    .select('id', { count: 'exact' })
                    .eq('status', 'disputed')
            ]);

            return {
                activeTournaments: activeTournaments || 0,
                activeUsers: activeUsers || 0,
                pendingDisputes: pendingDisputes || 0
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            throw error;
        }
    }

    static async getRecentActivity(): Promise<ActivityItem[]> {
        try {
            const [disputes, tournaments, transactions] = await Promise.all([
                supabase
                    .from('matches')
                    .select('id, created_at')
                    .eq('status', 'disputed')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('tournaments')
                    .select('id, title, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5),
                supabase
                    .from('transactions')
                    .select('id, amount, type, created_at')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);

            const activity: ActivityItem[] = [];

            disputes.data?.forEach(dispute => {
                activity.push({
                    icon: '⚠️',
                    title: 'New Dispute',
                    description: `Match #${dispute.id} has been disputed`,
                    timestamp: dispute.created_at
                });
            });

            tournaments.data?.forEach(tournament => {
                activity.push({
                    icon: '🏆',
                    title: 'New Tournament',
                    description: tournament.title,
                    timestamp: tournament.created_at
                });
            });

            transactions.data?.forEach(transaction => {
                activity.push({
                    icon: '💰',
                    title: `${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}`,
                    description: `$${transaction.amount}`,
                    timestamp: transaction.created_at
                });
            });

            return activity.sort((a, b) => 
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            ).slice(0, 10);
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            throw error;
        }
    }
}