import { InputValidator } from '../../services/security/input-validator';

describe('InputValidator', () => {
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello';
      expect(InputValidator.sanitizeInput(input)).toBe('Hello');
    });

    it('should prevent XSS attacks', () => {
      const input = 'javascript:alert("xss")';
      expect(InputValidator.sanitizeInput(input)).not.toContain('javascript:');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(InputValidator.validateEmail('test@example.com')).toBe(true);
      expect(InputValidator.validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate password requirements', () => {
      expect(InputValidator.validatePassword('Password123')).toBe(true);
      expect(InputValidator.validatePassword('weak')).toBe(false);
    });
  });
});