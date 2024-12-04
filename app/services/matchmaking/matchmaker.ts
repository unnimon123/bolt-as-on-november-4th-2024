import { Observable } from '@nativescript/core';
import { MatchService } from '../match-service';
import { ProfileService } from '../profile-service';
import { authService } from '../auth-service';

export class Matchmaker extends Observable {
    private static instance: Matchmaker;
    private searchInterval: any;
    private readonly SEARCH_INTERVAL = 5000; // 5 seconds
    private readonly RATING_RANGE_INCREMENT = 50;

    private constructor() {
        super();
    }

    static getInstance(): Matchmaker {
        if (!Matchmaker.instance) {
            Matchmaker.instance = new Matchmaker();
        }
        return Matchmaker.instance;
    }

    async startSearch(criteria: {
        gameType: string;
        entryFee: number;
        userId: string;
    }): Promise<void> {
        let searchTime = 0;
        let ratingRange = 100;

        this.searchInterval = setInterval(async () => {
            try {
                const match = await this.findMatch(criteria, ratingRange);
                if (match) {
                    this.stopSearch();
                    this.notifyPropertyChange('matchFound', match);
                }

                searchTime += this.SEARCH_INTERVAL;
                ratingRange = Math.min(500, 100 + Math.floor(searchTime / 30000) * this.RATING_RANGE_INCREMENT);
            } catch (error) {
                console.error('Matchmaking error:', error);
            }
        }, this.SEARCH_INTERVAL);
    }

    stopSearch(): void {
        if (this.searchInterval) {
            clearInterval(this.searchInterval);
            this.searchInterval = null;
        }
    }

    private async findMatch(criteria: any, ratingRange: number): Promise<any> {
        const userProfile = await ProfileService.getProfile(criteria.userId);
        if (!userProfile) return null;

        const { data: potentialMatches } = await MatchService.findPotentialMatches({
            gameType: criteria.gameType,
            entryFee: criteria.entryFee,
            rating: userProfile.rating,
            ratingRange: ratingRange,
            excludeUserId: criteria.userId
        });

        if (potentialMatches && potentialMatches.length > 0) {
            const opponent = potentialMatches[0];
            return await MatchService.createMatch({
                player1Id: criteria.userId,
                player2Id: opponent.id,
                gameType: criteria.gameType,
                entryFee: criteria.entryFee
            });
        }

        return null;
    }
}