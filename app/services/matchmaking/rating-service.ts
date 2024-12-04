export class RatingService {
  private static instance: RatingService;
  private readonly K_FACTOR = 32;
  private readonly INITIAL_RATING = 1000;
  private readonly MIN_RATING = 100;
  private readonly MAX_RATING = 3000;

  private constructor() {}

  static getInstance(): RatingService {
    if (!RatingService.instance) {
      RatingService.instance = new RatingService();
    }
    return RatingService.instance;
  }

  calculateNewRatings(
    player1Rating: number,
    player2Rating: number,
    player1Won: boolean,
    gameType?: string
  ): { player1NewRating: number; player2NewRating: number } {
    const expectedScore1 = this.calculateExpectedScore(player1Rating, player2Rating);
    const expectedScore2 = 1 - expectedScore1;

    const actualScore1 = player1Won ? 1 : 0;
    const actualScore2 = player1Won ? 0 : 1;

    const kFactor = this.getKFactor(player1Rating, player2Rating, gameType);

    const player1NewRating = Math.max(
      this.MIN_RATING,
      Math.min(
        this.MAX_RATING,
        Math.round(player1Rating + kFactor * (actualScore1 - expectedScore1))
      )
    );

    const player2NewRating = Math.max(
      this.MIN_RATING,
      Math.min(
        this.MAX_RATING,
        Math.round(player2Rating + kFactor * (actualScore2 - expectedScore2))
      )
    );

    return { player1NewRating, player2NewRating };
  }

  private calculateExpectedScore(rating1: number, rating2: number): number {
    return 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  }

  private getKFactor(rating1: number, rating2: number, gameType?: string): number {
    // Adjust K-factor based on ratings and game type
    const ratingDiff = Math.abs(rating1 - rating2);
    let kFactor = this.K_FACTOR;

    // Reduce K-factor for high-rated players
    if (Math.max(rating1, rating2) > 2000) {
      kFactor *= 0.8;
    }

    // Increase K-factor for new players
    if (Math.min(rating1, rating2) < 1200) {
      kFactor *= 1.2;
    }

    // Adjust for rating difference
    if (ratingDiff > 400) {
      kFactor *= 0.8;
    }

    return kFactor;
  }

  calculateSkillRange(
    baseRating: number,
    searchTime: number,
    maxRange: number = 500
  ): number {
    // Start with smaller range for high-rated players
    const initialRange = baseRating > 2000 ? 100 : 200;
    
    // Expand range based on search time (in seconds)
    const expansionRate = 50; // Rating points per 30 seconds
    const timeInMinutes = searchTime / 60000;
    const expansion = Math.floor(timeInMinutes * 2 * expansionRate);
    
    return Math.min(maxRange, initialRange + expansion);
  }

  isValidMatch(
    rating1: number,
    rating2: number,
    skillRange: number
  ): boolean {
    return Math.abs(rating1 - rating2) <= skillRange;
  }

  getInitialRating(): number {
    return this.INITIAL_RATING;
  }
}