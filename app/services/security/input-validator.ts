import { sanitizeHtml } from 'sanitize-html';
import { validate } from 'express-validator';
import xss from 'xss';

export class InputValidator {
  static sanitizeInput(input: string): string {
    // Remove HTML tags
    let sanitized = sanitizeHtml(input, {
      allowedTags: [],
      allowedAttributes: {}
    });

    // Prevent XSS
    sanitized = xss(sanitized);

    return sanitized;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): boolean {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  }

  static validateGameId(gameId: string): boolean {
    // Alphanumeric, 3-20 characters
    const gameIdRegex = /^[a-zA-Z0-9]{3,20}$/;
    return gameIdRegex.test(gameId);
  }
}