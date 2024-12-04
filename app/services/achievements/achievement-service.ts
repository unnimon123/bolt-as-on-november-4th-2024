import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';
import { NotificationService } from '../notification-service';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  criteria: {
    type: string;
    requirement: number;
  };
}

export class AchievementService extends Observable {
  private static instance: AchievementService;

  private constructor() {
    super();
  }

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  async checkAndAwardAchievements(userId: string): Promise<void> {
    const stats = await this.getUserStats(userId);
    const achievements = await this.getAvailableAchievements();

    for (const achievement of achievements) {
      if (await this.hasEarnedAchievement(userId, achievement.id)) {
        continue;
      }

      if (this.meetsAchievementCriteria(stats, achievement)) {
        await this.awardAchievement(userId, achievement);
      }
    }
  }

  private async getUserStats(userId: string): Promise<any> {
    const { data, error } = await supabase
      .from('player_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  private async getAvailableAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from('achievements')
      .select('*');

    if (error) throw error;
    return data;
  }

  private async hasEarnedAchievement(userId: string, achievementId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('id')
      .eq('user_id', userId)
      .eq('achievement_id', achievementId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  }

  private meetsAchievementCriteria(stats: any, achievement: Achievement): boolean {
    const { type, requirement } = achievement.criteria;
    
    switch (type) {
      case 'matches_won':
        return stats.matches_won >= requirement;
      case 'tournaments_won':
        return stats.tournaments_won >= requirement;
      case 'win_streak':
        return stats.current_win_streak >= requirement;
      default:
        return false;
    }
  }

  private async awardAchievement(userId: string, achievement: Achievement): Promise<void> {
    const { error } = await supabase
      .from('user_achievements')
      .insert([{
        user_id: userId,
        achievement_id: achievement.id,
        earned_at: new Date().toISOString()
      }]);

    if (error) throw error;

    await NotificationService.getInstance().createNotification({
      userId,
      title: 'Achievement Unlocked!',
      message: `You've earned the "${achievement.title}" achievement!`,
      type: 'achievement'
    });
  }
}