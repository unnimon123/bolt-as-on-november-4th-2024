import { alert } from '@nativescript/core';

export class ErrorHandler {
  static handle(error: any, customMessage?: string): void {
    console.error('Error:', error);

    let message = customMessage || 'An unexpected error occurred';

    if (error.message) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    }

    // Handle specific Supabase errors
    if (error.code) {
      switch (error.code) {
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          message = 'This account has been disabled';
          break;
        case 'auth/user-not-found':
          message = 'No account found with this email';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case '23505': // Unique violation
          message = 'This username or email is already taken';
          break;
        default:
          if (error.code.startsWith('storage/')) {
            message = 'File upload failed. Please try again.';
          }
      }
    }

    alert({
      title: 'Error',
      message,
      okButtonText: 'OK'
    });
  }
}