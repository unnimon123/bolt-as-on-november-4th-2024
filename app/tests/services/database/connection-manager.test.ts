import { ConnectionManager } from '../../../services/database/connection-manager';
import { SecureStorageService } from '../../../services/secure-storage';

jest.mock('../../../services/secure-storage');

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    connectionManager = ConnectionManager.getInstance();
  });

  describe('initialization', () => {
    it('should initialize connection successfully', async () => {
      (SecureStorageService.getInstance().getItem as jest.Mock)
        .mockResolvedValueOnce('SUPABASE_URL')
        .mockResolvedValueOnce('SUPABASE_KEY');

      const status = await new Promise(resolve => {
        connectionManager.getConnectionStatus().subscribe(resolve);
      });

      expect(status).toBe('connected');
    });

    it('should handle connection failure', async () => {
      (SecureStorageService.getInstance().getItem as jest.Mock)
        .mockRejectedValue(new Error('Connection failed'));

      const status = await new Promise(resolve => {
        connectionManager.getConnectionStatus().subscribe(resolve);
      });

      expect(status).toBe('disconnected');
    });
  });

  describe('executeWithRetry', () => {
    it('should retry failed operations', async () => {
      const operation = jest.fn()
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce('Success');

      const result = await connectionManager.executeWithRetry(operation);
      expect(result).toBe('Success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });
});