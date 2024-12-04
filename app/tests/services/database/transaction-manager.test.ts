import { TransactionManager } from '../../../services/database/transaction-manager';
import { ConnectionManager } from '../../../services/database/connection-manager';

jest.mock('../../../services/database/connection-manager');

describe('TransactionManager', () => {
  let transactionManager: TransactionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    transactionManager = TransactionManager.getInstance();
  });

  describe('executeTransaction', () => {
    it('should execute transaction successfully', async () => {
      const mockOperation = jest.fn().mockResolvedValue('result');
      
      const result = await transactionManager.executeTransaction(mockOperation);
      
      expect(result).toBe('result');
      expect(mockOperation).toHaveBeenCalled();
    });

    it('should handle transaction timeout', async () => {
      const mockOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      await expect(
        transactionManager.executeTransaction(mockOperation, { timeout: 100 })
      ).rejects.toThrow('Transaction timeout');
    });
  });

  describe('batchOperation', () => {
    it('should process batch operations', async () => {
      const items = [1, 2, 3];
      const mockOperation = jest.fn().mockResolvedValue('processed');

      const results = await transactionManager.batchOperation(items, mockOperation);

      expect(results).toHaveLength(3);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });
  });
});