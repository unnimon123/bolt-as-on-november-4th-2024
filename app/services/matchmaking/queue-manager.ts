import { Observable } from '@nativescript/core';
import { EnhancedMatchmaker } from './enhanced-matchmaker';
import { supabase } from '../supabase';

interface QueueEntry {
  userId: string;
  gameType: string;
  entryFee: number;
  rating: number;
  region: string;
  created_at: string;
}

export class QueueManager extends Observable {
  private static instance: QueueManager;
  private matchmaker: EnhancedMatchmaker;
  private queueCheckInterval: any;
  private readonly CHECK_INTERVAL = 5000;
  private readonly MAX_QUEUE_TIME = 300000;

  private constructor() {
    super();
    this.matchmaker = EnhancedMatchmaker.getInstance();
  }

  static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  async addToQueue(entry: Omit<QueueEntry, 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('matchmaking_queue')
      .insert([entry]);

    if (error) throw error;

    this.startQueueCheck(entry);
  }

  private async startQueueCheck(entry: Omit<QueueEntry, 'created_at'>): Promise<void> {
    let queueTime = 0;

    this.queueCheckInterval = setInterval(async () => {
      try {
        const match = await this.matchmaker.findMatch(entry);
        
        if (match) {
          await this.createMatch(entry.userId, match, entry);
          this.clearQueue([entry.userId, match]);
          this.stopQueueCheck();
          return;
        }

        queueTime += this.CHECK_INTERVAL;
        if (queueTime >= this.MAX_QUEUE_TIME) {
          await this.removeFromQueue(entry.userId);
          this.stopQueueCheck();
          this.notifyPropertyChange('queueTimeout', true);
        }
      } catch (error) {
        console.error('Queue check error:', error);
      }
    }, this.CHECK_INTERVAL);
  }

  private async createMatch(player1Id: string, player2Id: string, entry: Omit<QueueEntry, 'created_at'>): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .insert([{
        player1_id: player1Id,
        player2_id: player2Id,
        game_type: entry.gameType,
        entry_fee: entry.entryFee,
        status: 'scheduled'
      }]);

    if (error) throw error;
  }

  private async clearQueue(playerIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .in('user_id', playerIds);

    if (error) throw error;
  }

  private async removeFromQueue(userId: string): Promise<void> {
    const { error } = await supabase
      .from('matchmaking_queue')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }

  private stopQueueCheck(): void {
    if (this.queueCheckInterval) {
      clearInterval(this.queueCheckInterval);
      this.queueCheckInterval = null;
    }
  }
}