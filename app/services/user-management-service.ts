import { supabase } from './supabase';

export class UserManagementService {
    static async getUsers() {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id,
                username,
                email,
                avatar_url,
                wallet_balance,
                is_online,
                is_suspended,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    static async getUserDetails(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                matches:matches(count),
                tournaments:tournaments(count),
                transactions:transactions(*)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    }

    static async toggleUserSuspension(userId: string) {
        const { data: user } = await supabase
            .from('profiles')
            .select('is_suspended')
            .eq('id', userId)
            .single();

        const { error } = await supabase
            .from('profiles')
            .update({ is_suspended: !user?.is_suspended })
            .eq('id', userId);

        if (error) throw error;
    }

    static async deleteUser(userId: string) {
        const { error } = await supabase
            .from('profiles')
            .delete()
            .eq('id', userId);

        if (error) throw error;
    }

    static async updateUserDetails(userId: string, updates: any) {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
    }
}