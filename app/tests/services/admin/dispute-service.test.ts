import { DisputeService } from '../../../services/admin/dispute-service';
import { supabase } from '../../../services/supabase';
import { NotificationService } from '../../../services/notification-service';

jest.mock('../../../services/supabase');
jest.mock('../../../services/notification-service');

describe('DisputeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolveDispute', () => {
    it('should resolve dispute and update match', async () => {
      const mockDispute = {
        id: '1',
        match_id: '1',
        reported_by: 'user1'
      };

      (supabase.from as jest.Mock).mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDispute })
      }));

      await DisputeService.resolveDispute('1', {
        winnerId: 'user1',
        adminNotes: 'Resolved'
      });

      expect(NotificationService.getInstance().createNotification).toHaveBeenCalled();
    });
  });
});