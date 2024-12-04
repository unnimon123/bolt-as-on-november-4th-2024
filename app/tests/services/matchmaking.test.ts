import { QueueService } from '../../services/matchmaking/queue-service';
import { ChallengeService } from '../../services/matchmaking/challenge-service';
import { supabase } from '../../services/supabase';

jest.mock('../../services/supabase');

describe('Matchmaking Services', () => {
  describe('QueueService', () => {
    let queueService: QueueService;

    beforeEach(() => {
      queueService = QueueService.getInstance();
      jest.clearAllMocks();
    });

    it('should join queue successfully', async () => {
      const mockEntry = {
        userId: '1',
        gameType: 'Fortnite',
        entryFee: 10,
        rating: 1000
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(queueService.joinQueue(mockEntry)).resolves.not.toThrow();
    });
  });

  describe('ChallengeService', () => {
    let challengeService: ChallengeService;

    beforeEach(() => {
      challengeService = ChallengeService.getInstance();
      jest.clearAllMocks();
    });

    it('should send challenge successfully', async () => {
      const mockChallenge = {
        challengerId: '1',
        opponentId: '2',
        gameType: 'Fortnite',
        entryFee: 10
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: null })
      });

      await expect(challengeService.sendChallenge(mockChallenge)).resolves.not.toThrow();
    });
  });
});