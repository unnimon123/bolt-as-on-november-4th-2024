import { SecureStorage } from '@nativescript/core';

export class SecureStorageService {
  private static instance: SecureStorageService;
  private storage: SecureStorage;

  private constructor() {
    this.storage = new SecureStorage();
  }

  static getInstance(): SecureStorageService {
    if (!SecureStorageService.instance) {
      SecureStorageService.instance = new SecureStorageService();
    }
    return SecureStorageService.instance;
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await this.storage.setSync(key, value);
    } catch (error) {
      console.error('Error storing secure data:', error);
      throw error;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      return await this.storage.getSync(key);
    } catch (error) {
      console.error('Error retrieving secure data:', error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await this.storage.removeSync(key);
    } catch (error) {
      console.error('Error removing secure data:', error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.storage.clearSync();
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw error;
    }
  }
}