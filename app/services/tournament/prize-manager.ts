import { WalletService } from '../wallet-service';
import type { Tournament } from '../supabase';

export class PrizeManager {
    private static readonly PRIZE_DISTRIBUTION = {
        first: 0.6,
        second: 0.3,
        third: 0.1
    };

    static async distributePrizes(tournament: Tournament, winners: string[]): Promise<void> {
        const prizes = this.calculatePrizes(tournament.prize_pool);
        
        for (let i = 0; i < winners.length; i++) {
            const prize = prizes[i] || 0;
            if (prize > 0) {
                await WalletService.processPrizeDistribution(
                    tournament.id,
                    winners[i],
                    prize
                );
            }
        }
    }

    private static calculatePrizes(totalPrizePool: number): number[] {
        return [
            totalPrizePool * this.PRIZE_DISTRIBUTION.first,
            totalPrizePool * this.PRIZE_DISTRIBUTION.second,
            totalPrizePool * this.PRIZE_DISTRIBUTION.third
        ];
    }
}