import { JWTManager } from '../../services/security/jwt-manager';
import { SecureStorageService } from '../../services/secure-storage';

jest.mock('../../services/secure-storage');

describe('JWTManager', () => {
  let jwtManager: JWTManager;

  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStorageService.getInstance().getItem as jest.Mock)
      .mockResolvedValue('test-secret');
    jwtManager = JWTManager.getInstance();
  });

  it('should generate valid JWT token', async () => {
    const payload = { userId: '123' };
    const token = await jwtManager.generateToken(payload);
    expect(token).toBeTruthy();
  });

  it('should verify valid token', async () => {
    const payload = { userId: '123' };
    const token = await jwtManager.generateToken(payload);
    const decoded = await jwtManager.verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
  });

  it('should reject invalid token', async () => {
    await expect(jwtManager.verifyToken('invalid-token'))
      .rejects.toThrow();
  });
});