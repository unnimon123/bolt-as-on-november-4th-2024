import { TournamentService } from '../../services/tournament-service';
import { supabase } from '../../services/supabase';

jest.mock('../../services/supabase');

describe('TournamentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listTournaments', () => {
    it('should return tournaments filtered by status', async () => {
      const mockTournaments = [
        { id: '1', title: 'Tournament 1', status: 'open' },
        { id: '2', title: 'Tournament 2', status: 'open' }
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockTournaments, error: null })
        })
      });

      const result = await TournamentService.listTournaments({ status: 'open' });
      expect(result).toEqual(mockTournaments);
    });
  });

  describe('createTournament', () => {
    it('should create a new tournament', async () => {
      const mockTournament = {
        title: 'New Tournament',
        game_type: 'Fortnite',
        entry_fee: 10,
        max_participants: 8
      };

      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: { ...mockTournament, id: '1' },
            error: null
          })
        })
      });

      const result = await TournamentService.createTournament(mockTournament);
      expect(result).toHaveProperty('id');
      expect(result.title).toBe(mockTournament.title);
    });
  });
});