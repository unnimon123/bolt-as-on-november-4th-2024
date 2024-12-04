import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';
import { ProfileService } from '../profile-service';
import { RegionService } from './region-service';
import { RatingService } from './rating-service';
import { MatchmakingQueue } from './queue-service';

interface QuickMatchParams {
  userId: string;
  gameType: string;
  entryFee: number;
  region?: string;
  skillRange?: number;
}

export class QuickMatchService extends Observable {
  private static instance: QuickMatchService;
  private searchInterval: any;
  private readonly SEARCH_TIMEOUT = 300000; // 5 minutes
  private readonly SKILL_RANGE_INCREMENT = 50;
  private readonly PLATFORM_COMMISSION = 0.10; // 10%
  private queue: MatchmakingQueue;
  private ratingService: RatingService;
  private regionService: RegionService;

  private constructor() {
    super();
    this.queue = MatchmakingQueue.getInstance();
    this.ratingService = RatingService.getInstance();
    this.regionService = RegionService.getInstance();
  }

  static getInstance(): QuickMatchService {
    if (!QuickMatchService.instance) {
      QuickMatchService.instance = new QuickMatchService();
    }
    return QuickMatchService.instance;
  }

  async startSearch(params: QuickMatchParams): Promise<void> {
    let searchTime = 0;
    let skillRange = params.skillRange || 100;
    const userRegion = params.region || await this.regionService.getUserRegion();

    this.searchInterval = setInterval(async () => {
      try {
        const match = await this.findMatch({
          ...params,
          region: userRegion,
          skillRange
        });

        if (match) {
          this.stopSearch();
          this.notifyPropertyChange('matchFound', match);
          return;
        }

        searchTime += 30000; // 30 seconds
        if (searchTime >= this.SEARCH_TIMEOUT) {
          this.stopSearch();
          this.notifyPropertyChange('searchTimeout', true);
          return;
        }

        // Expand search criteria
        skillRange = Math.min(500, skillRange + this.SKILL_RANGE_INCREMENT);
        this.notifyPropertyChange('searchRange', {
          skillRange,
          searchTime
        });
      } catch (error) {
        console.error('Quick match error:', error);
        this.notifyPropertyChange('searchError', error);
      }
    }, 30000);
  }

  stopSearch(): void {
    if (this.searchInterval) {
      clearInterval(this.searchInterval);
      this.searchInterval = null;
      this.queue.removeFromQueue(this.currentUserId);
    }
  }

  private async findMatch(params: Required<QuickMatchParams>): Promise<any> {
    const userProfile = await ProfileService.getProfile(params.userId);
    if (!userProfile) return null;

    // Find match based on criteria
    const match = await this.queue.findMatch({
      userId: params.userId,
      gameType: params.gameType,
      entryFee: params.entryFee,
      rating: userProfile.rating,
      region: params.region,
      skillRange: params.skillRange
    });

    if (match) {
      return await this.createMatch(params.userId, match.userId, params);
    }

    // Add to queue if no match found
    await this.queue.addToQueue({
      userId: params.userId,
      gameType: params.gameType,
      entryFee: params.entryFee,
      rating: userProfile.rating,
      region: params.region
    });

    return null;
  }

  private async createMatch(
    player1Id: string,
    player2Id: string,
    params: QuickMatchParams
  ): Promise<any> {
    const totalPrize = params.entryFee * 2;
    const platformFee = totalPrize * this.PLATFORM_COMMISSION;
    const prizePool = totalPrize - platformFee;

    const { data: match, error } = await supabase
      .from('matches')
      .insert([{
        player1_id: player1Id,
        player2_id: player2Id,
        game_type: params.gameType,
        entry_fee: params.entryFee,
        prize_pool: prizePool,
        platform_fee: platformFee,
        status: 'scheduled',
        region: params.region
      }])
      .select()
      .single();

    if (error) throw error;

    // Remove both players from queue
    await Promise.all([
      this.queue.removeFromQueue(player1Id),
      this.queue.removeFromQueue(player2Id)
    ]);

    return match;
  }

  get currentUserId(): string {
    return 'current-user-id'; // Replace with actual implementation
  }
}