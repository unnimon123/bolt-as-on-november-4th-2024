import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';

export interface LeaderboardEntry {
  user_id: string;
  username: string;
  avatar_url: string;
  score: number;
  rank: number;
  change: number;
}

export class LeaderboardService extends Observable {
  private static instance: LeaderboardService;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cachedLeaderboards: Map<string, { data: LeaderboardEntry[]; timestamp: number }> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): LeaderboardService {
    if (!LeaderboardService.instance) {
      LeaderboardService.instance = new LeaderboardService();
    }
    return LeaderboardService.instance;
  }

  async getLeaderboard(
    type: 'global' | 'monthly' | 'weekly',
    category: 'rating' | 'wins' | 'earnings',
    limit: number = 100
  ): Promise<LeaderboardEntry[]> {
    const cacheKey = `${type}_${category}`;
    const cached = this.cachedLeaderboards.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_type: type,
      p_category: category,
      p_limit: limit
    });

    if (error) throw error;

    this.cachedLeaderboards.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async getUserRank(userId: string, category: 'rating' | 'wins' | 'earnings'): Promise<number> {
    const { data, error } = await supabase.rpc('get_user_rank', {
      p_user_id: userId,
      p_category: category
    });

    if (error) throw error;
    return data;
  }

  async getPlayerProgress(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  subscribeToLeaderboardUpdates(callback: (update: any) => void): void {
    supabase
      .channel('leaderboard_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'player_statistics'
      }, payload => {
        callback(payload);
      })
      .subscribe();
  }
}