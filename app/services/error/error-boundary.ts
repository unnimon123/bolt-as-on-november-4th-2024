import { Observable, Subject } from 'rxjs';
import { ErrorHandler } from '@nativescript/core';

export class GlobalErrorBoundary {
  private static instance: GlobalErrorBoundary;
  private errorSubject = new Subject<Error>();

  private constructor() {
    this.setupGlobalErrorHandler();
  }

  static getInstance(): GlobalErrorBoundary {
    if (!GlobalErrorBoundary.instance) {
      GlobalErrorBoundary.instance = new GlobalErrorBoundary();
    }
    return GlobalErrorBoundary.instance;
  }

  private setupGlobalErrorHandler() {
    ErrorHandler.addEventListener({
      handleError: (error: Error) => {
        this.handleError(error);
      }
    });

    // Handle unhandled promise rejections
    global.handleUnhandledRejection = (reason: any) => {
      this.handleError(reason instanceof Error ? reason : new Error(String(reason)));
    };
  }

  private handleError(error: Error) {
    console.error('Global error caught:', error);
    
    // Log error to analytics/monitoring service
    this.logError(error);
    
    // Notify subscribers
    this.errorSubject.next(error);
    
    // Attempt recovery based on error type
    this.attemptRecovery(error);
  }

  private logError(error: Error) {
    // Implement error logging to your preferred service
    // Example: Sentry, LogRocket, etc.
    console.error('Error logged:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  private attemptRecovery(error: Error) {
    if (error instanceof TypeError) {
      // Handle type errors (often due to null/undefined)
      this.handleTypeError(error);
    } else if (error.message.includes('network')) {
      // Handle network errors
      this.handleNetworkError(error);
    } else if (error.message.includes('auth')) {
      // Handle authentication errors
      this.handleAuthError(error);
    }
  }

  private handleTypeError(error: TypeError) {
    // Implement type error recovery logic
    console.log('Handling type error:', error);
  }

  private handleNetworkError(error: Error) {
    // Implement network error recovery logic
    console.log('Handling network error:', error);
  }

  private handleAuthError(error: Error) {
    // Implement authentication error recovery logic
    console.log('Handling auth error:', error);
  }

  getErrorStream(): Observable<Error> {
    return this.errorSubject.asObservable();
  }
}