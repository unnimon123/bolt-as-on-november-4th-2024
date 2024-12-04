import { ModerationService } from '../../../services/admin/moderation-service';
import { supabase } from '../../../services/supabase';
import { NotificationService } from '../../../services/notification-service';

jest.mock('../../../services/supabase');
jest.mock('../../../services/notification-service');

describe('ModerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('suspendUser', () => {
    it('should suspend user and send notification', async () => {
      const userId = 'user1';
      const reason = 'Violation of terms';
      const duration = 7;

      (supabase.from as jest.Mock).mockImplementation(() => ({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null })
      }));

      await ModerationService.suspendUser(userId, reason, duration);

      expect(NotificationService.getInstance().createNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          userId,
          type: 'account_status'
        })
      );
    });
  });
});