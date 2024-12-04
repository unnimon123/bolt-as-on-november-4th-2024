import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';

interface QueueEntry {
  userId: string;
  gameType: string;
  entryFee: number;
  rating: number;
  region: string;
  skillRange?: number;
}

export class MatchmakingQueue extends Observable {
  private static instance: MatchmakingQueue;
  private readonly QUEUE_TIMEOUT = 300000; // 5 minutes
  private readonly MAX_QUEUE_SIZE = 1000;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  private constructor() {
    super();
    this.startCleanupInterval();
  }

  static getInstance(): MatchmakingQueue {
    if (!MatchmakingQueue.instance) {
      MatchmakingQueue.instance = new MatchmakingQueue();
    }
    return MatchmakingQueue.instance;
  }

  async addToQueue(entry: QueueEntry): Promise<void> {
    try {
      // Check if user is already in queue
      const existing = await this.findUserInQueue(entry.userId);
      if (existing) {
        await this.removeFromQueue(entry.userId);
      }

      // Add to queue
      const { error } = await supabase
        .from('matchmaking_queue')
        .insert([{
          user_id: entry.userId,
          game_type: entry.gameType,
          entry_fee: entry.entryFee,
          rating: entry.rating,
          region: entry.region,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;

      this.notifyPropertyChange('queueUpdated', true);
    } catch (error) {
      console.error('Error adding to queue:', error);
      throw error;
    }
  }

  async removeFromQueue(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('matchmaking_queue')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      this.notifyPropertyChange('queueUpdated', true);
    } catch (error) {
      console.error('Error removing from queue:', error);
      throw error;
    }
  }

  async findMatch(criteria: QueueEntry): Promise<QueueEntry | null> {
    try {
      const { data, error } = await supabase
        .from('matchmaking_queue')
        .select('*')
        .neq('user_id', criteria.userId)
        .eq('game_type', criteria.gameType)
        .eq('entry_fee', criteria.entryFee)
        .eq('region', criteria.region)
        .gte('rating', criteria.rating - (criteria.skillRange || 100))
        .lte('rating', criteria.rating + (criteria.skillRange || 100))
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error finding match:', error);
      return null;
    }
  }

  private async findUserInQueue(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  private startCleanupInterval(): void {
    setInterval(async () => {
      try {
        const timeout = new Date(Date.now() - this.QUEUE_TIMEOUT).toISOString();
        
        const { error } = await supabase
          .from('matchmaking_queue')
          .delete()
          .lt('created_at', timeout);

        if (error) throw error;
      } catch (error) {
        console.error('Error cleaning up queue:', error);
      }
    }, this.CLEANUP_INTERVAL);
  }

  async getQueueStats(): Promise<{
    totalPlayers: number;
    averageWaitTime: number;
    regionStats: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from('matchmaking_queue')
      .select('created_at, region');

    if (error) throw error;

    const now = Date.now();
    const waitTimes = data.map(entry => 
      now - new Date(entry.created_at).getTime()
    );

    const regionStats = data.reduce((acc, entry) => {
      acc[entry.region] = (acc[entry.region] || 0) + 1;
      return acc;
    }, {});

    return {
      totalPlayers: data.length,
      averageWaitTime: waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length,
      regionStats
    };
  }
}