import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';
import { sanitizeHtml } from 'sanitize-html';

export class ChatService extends Observable {
  private static instance: ChatService;
  private subscriptions: Map<string, any> = new Map();

  private constructor() {
    super();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  async sendDirectMessage(senderId: string, receiverId: string, message: string): Promise<void> {
    const sanitizedMessage = sanitizeHtml(message);
    const { error } = await supabase
      .from('direct_messages')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        message: sanitizedMessage
      }]);

    if (error) throw error;
  }

  async getConversation(userId1: string, userId2: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('direct_messages')
      .select(`
        *,
        sender:profiles!sender_id(username),
        receiver:profiles!receiver_id(username)
      `)
      .or(`sender_id.eq.${userId1},receiver_id.eq.${userId1}`)
      .or(`sender_id.eq.${userId2},receiver_id.eq.${userId2}`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  subscribeToDirectMessages(userId: string, callback: (message: any) => void): void {
    const subscription = supabase
      .channel(`direct_messages:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `receiver_id=eq.${userId}`
      }, payload => {
        callback(payload.new);
      })
      .subscribe();

    this.subscriptions.set(userId, subscription);
  }

  unsubscribeFromDirectMessages(userId: string): void {
    const subscription = this.subscriptions.get(userId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(userId);
    }
  }
}