import { Observable } from '@nativescript/core';
import { supabase } from './supabase';

export class RealtimeService extends Observable {
  private static instance: RealtimeService;
  private subscriptions: Map<string, any> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  subscribeToMatch(matchId: string, callback: (payload: any) => void): void {
    const subscription = supabase
      .channel(`match:${matchId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${matchId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`match:${matchId}`, subscription);
  }

  subscribeToTournament(tournamentId: string, callback: (payload: any) => void): void {
    const subscription = supabase
      .channel(`tournament:${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tournaments',
        filter: `id=eq.${tournamentId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`tournament:${tournamentId}`, subscription);
  }

  subscribeToChatMessages(matchId: string, callback: (payload: any) => void): void {
    const subscription = supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `match_id=eq.${matchId}`
      }, callback)
      .subscribe();

    this.subscriptions.set(`chat:${matchId}`, subscription);
  }

  unsubscribe(channel: string): void {
    const subscription = this.subscriptions.get(channel);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(channel);
    }
  }

  unsubscribeAll(): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this.subscriptions.clear();
  }
}