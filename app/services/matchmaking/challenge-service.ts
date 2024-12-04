import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';
import { ProfileService } from '../profile-service';

interface Challenge {
  challengerId: string;
  opponentId: string;
  gameType: string;
  entryFee: number;
}

export class ChallengeService extends Observable {
  private static instance: ChallengeService;
  private readonly PLATFORM_FEE = 0.10; // 10%

  private constructor() {
    super();
  }

  static getInstance(): ChallengeService {
    if (!ChallengeService.instance) {
      ChallengeService.instance = new ChallengeService();
    }
    return ChallengeService.instance;
  }

  async searchPlayers(query: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, game_id, rating')
      .or(`game_id.ilike.%${query}%,username.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data;
  }

  async sendChallenge(challenge: Challenge): Promise<void> {
    try {
      // Verify challenger has sufficient balance
      const challenger = await ProfileService.getProfile(challenge.challengerId);
      if (challenger.wallet_balance < challenge.entryFee) {
        throw new Error('Insufficient balance');
      }

      // Create challenge
      const { error } = await supabase
        .from('challenges')
        .insert([{
          challenger_id: challenge.challengerId,
          opponent_id: challenge.opponentId,
          game_type: challenge.gameType,
          entry_fee: challenge.entryFee,
          status: 'pending'
        }]);

      if (error) throw error;

      // Send notification to opponent
      await NotificationService.getInstance().createNotification({
        userId: challenge.opponentId,
        title: 'New Challenge',
        message: `${challenger.username} has challenged you to a ${challenge.gameType} match for $${challenge.entryFee}`,
        type: 'match_invite'
      });
    } catch (error) {
      console.error('Error sending challenge:', error);
      throw error;
    }
  }

  async acceptChallenge(challengeId: string): Promise<void> {
    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Verify opponent has sufficient balance
      const opponent = await ProfileService.getProfile(challenge.opponent_id);
      if (opponent.wallet_balance < challenge.entry_fee) {
        throw new Error('Insufficient balance');
      }

      const totalPrize = challenge.entry_fee * 2;
      const platformFee = totalPrize * this.PLATFORM_FEE;
      const prizePool = totalPrize - platformFee;

      // Create match and process entry fees in transaction
      const { error: acceptError } = await supabase.rpc('accept_challenge', {
        p_challenge_id: challengeId,
        p_prize_pool: prizePool,
        p_platform_fee: platformFee
      });

      if (acceptError) throw acceptError;

      // Notify challenger
      await NotificationService.getInstance().createNotification({
        userId: challenge.challenger_id,
        title: 'Challenge Accepted',
        message: `${opponent.username} has accepted your challenge!`,
        type: 'match_invite'
      });
    } catch (error) {
      console.error('Error accepting challenge:', error);
      throw error;
    }
  }

  async declineChallenge(challengeId: string): Promise<void> {
    try {
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      const { error: updateError } = await supabase
        .from('challenges')
        .update({ status: 'declined' })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Notify challenger
      const opponent = await ProfileService.getProfile(challenge.opponent_id);
      await NotificationService.getInstance().createNotification({
        userId: challenge.challenger_id,
        title: 'Challenge Declined',
        message: `${opponent.username} has declined your challenge`,
        type: 'match_invite'
      });
    } catch (error) {
      console.error('Error declining challenge:', error);
      throw error;
    }
  }

  async getChallenges(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('challenges')
      .select(`
        *,
        challenger:profiles!challenger_id(username),
        opponent:profiles!opponent_id(username)
      `)
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
}