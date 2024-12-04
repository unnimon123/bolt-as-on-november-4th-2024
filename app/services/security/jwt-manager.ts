import jwt from 'jsonwebtoken';
import { SecureStorageService } from '../secure-storage';

export class JWTManager {
  private static instance: JWTManager;
  private secureStorage: SecureStorageService;

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
  }

  static getInstance(): JWTManager {
    if (!JWTManager.instance) {
      JWTManager.instance = new JWTManager();
    }
    return JWTManager.instance;
  }

  async generateToken(payload: any): Promise<string> {
    const secret = await this.secureStorage.getItem('JWT_SECRET');
    if (!secret) throw new Error('JWT secret not found');

    return jwt.sign(payload, secret, {
      expiresIn: '24h',
      algorithm: 'HS256'
    });
  }

  async verifyToken(token: string): Promise<any> {
    const secret = await this.secureStorage.getItem('JWT_SECRET');
    if (!secret) throw new Error('JWT secret not found');

    return jwt.verify(token, secret);
  }
}