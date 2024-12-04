import { BracketService } from '../bracket-service';
import type { Match, Tournament } from '../supabase';

export class BracketManager {
    static async generateBracket(tournament: Tournament, participants: string[]): Promise<void> {
        const rounds = Math.ceil(Math.log2(participants.length));
        const matches = this.generateMatchPairs(participants);
        
        await BracketService.generateBracket(tournament.id, matches);
    }

    static async updateBracket(matchId: string, winnerId: string): Promise<void> {
        await BracketService.updateBracketMatch(matchId, { winner_id: winnerId });
    }

    private static generateMatchPairs(participants: string[]): [string, string][] {
        const shuffled = [...participants].sort(() => Math.random() - 0.5);
        const pairs: [string, string][] = [];
        
        for (let i = 0; i < shuffled.length - 1; i += 2) {
            pairs.push([shuffled[i], shuffled[i + 1]]);
        }
        
        return pairs;
    }
}