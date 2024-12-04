import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';

export class TournamentChatService extends Observable {
  private static instance: TournamentChatService;
  private subscriptions: Map<string, any> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): TournamentChatService {
    if (!TournamentChatService.instance) {
      TournamentChatService.instance = new TournamentChatService();
    }
    return TournamentChatService.instance;
  }

  async sendMessage(tournamentId: string, userId: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('tournament_chat')
      .insert([{
        tournament_id: tournamentId,
        user_id: userId,
        message: message
      }]);

    if (error) throw error;
  }

  async getMessages(tournamentId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('tournament_chat')
      .select(`
        *,
        user:profiles!user_id(username)
      `)
      .eq('tournament_id', tournamentId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  subscribeToChatMessages(tournamentId: string, callback: (message: any) => void): void {
    const subscription = supabase
      .channel(`tournament_chat:${tournamentId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tournament_chat',
        filter: `tournament_id=eq.${tournamentId}`
      }, payload => {
        callback(payload.new);
      })
      .subscribe();

    this.subscriptions.set(tournamentId, subscription);
  }

  unsubscribeFromChat(tournamentId: string): void {
    const subscription = this.subscriptions.get(tournamentId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(tournamentId);
    }
  }
}