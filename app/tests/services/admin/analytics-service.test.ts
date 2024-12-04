import { AnalyticsService } from '../../../services/admin/analytics-service';
import { supabase } from '../../../services/supabase';

jest.mock('../../../services/supabase');

describe('AnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardMetrics', () => {
    it('should return complete analytics data', async () => {
      const mockData = {
        totalUsers: 100,
        activeTournaments: 5,
        totalRevenue: 1000,
        activeMatches: 10,
        userGrowth: [{ date: '2024-01-01', count: 5 }],
        revenueByDay: [{ date: '2024-01-01', amount: 100 }]
      };

      (supabase.from as jest.Mock).mockImplementation((table) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockData[table] })
      }));

      const result = await AnalyticsService.getDashboardMetrics();
      expect(result).toEqual(expect.objectContaining({
        totalUsers: expect.any(Number),
        activeTournaments: expect.any(Number),
        totalRevenue: expect.any(Number)
      }));
    });
  });
});