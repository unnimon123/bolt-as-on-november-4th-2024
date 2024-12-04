import { Observable } from '@nativescript/core';
import { supabase } from '../supabase';

interface MatchCriteria {
  userId: string;
  gameType: string;
  entryFee: number;
  rating: number;
  region: string;
}

interface WeightedPlayer {
  id: string;
  rating: number;
  region: string;
  waitTime: number;
  score: number;
}

export class EnhancedMatchmaker extends Observable {
  private static instance: EnhancedMatchmaker;
  private readonly RATING_WEIGHT = 0.4;
  private readonly WAIT_TIME_WEIGHT = 0.3;
  private readonly REGION_WEIGHT = 0.3;
  private readonly MAX_RATING_DIFF = 300;
  private readonly REGION_PENALTY = 0.5;

  private constructor() {
    super();
  }

  static getInstance(): EnhancedMatchmaker {
    if (!EnhancedMatchmaker.instance) {
      EnhancedMatchmaker.instance = new EnhancedMatchmaker();
    }
    return EnhancedMatchmaker.instance;
  }

  async findMatch(criteria: MatchCriteria): Promise<string | null> {
    const { data: queuedPlayers } = await supabase
      .from('matchmaking_queue')
      .select('*')
      .neq('user_id', criteria.userId)
      .eq('game_type', criteria.gameType)
      .eq('entry_fee', criteria.entryFee);

    if (!queuedPlayers?.length) return null;

    const weightedPlayers = queuedPlayers.map(player => ({
      id: player.user_id,
      rating: player.rating,
      region: player.region,
      waitTime: this.calculateWaitTime(player.created_at),
      score: 0
    }));

    // Calculate scores for each player
    weightedPlayers.forEach(player => {
      player.score = this.calculateMatchScore(player, criteria);
    });

    // Sort by score and get best match
    weightedPlayers.sort((a, b) => b.score - a.score);
    return weightedPlayers[0]?.score > 0.6 ? weightedPlayers[0].id : null;
  }

  private calculateMatchScore(player: WeightedPlayer, criteria: MatchCriteria): number {
    const ratingScore = this.calculateRatingScore(player.rating, criteria.rating);
    const waitTimeScore = this.calculateWaitTimeScore(player.waitTime);
    const regionScore = this.calculateRegionScore(player.region, criteria.region);

    return (
      this.RATING_WEIGHT * ratingScore +
      this.WAIT_TIME_WEIGHT * waitTimeScore +
      this.REGION_WEIGHT * regionScore
    );
  }

  private calculateRatingScore(rating1: number, rating2: number): number {
    const diff = Math.abs(rating1 - rating2);
    return Math.max(0, 1 - (diff / this.MAX_RATING_DIFF));
  }

  private calculateWaitTimeScore(waitTime: number): number {
    // Normalize wait time (max 5 minutes)
    return Math.min(waitTime / 300, 1);
  }

  private calculateRegionScore(region1: string, region2: string): number {
    return region1 === region2 ? 1 : this.REGION_PENALTY;
  }

  private calculateWaitTime(createdAt: string): number {
    return (Date.now() - new Date(createdAt).getTime()) / 1000;
  }
}