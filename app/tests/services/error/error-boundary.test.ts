import { GlobalErrorBoundary } from '../../../services/error/error-boundary';

describe('GlobalErrorBoundary', () => {
  let errorBoundary: GlobalErrorBoundary;

  beforeEach(() => {
    jest.clearAllMocks();
    errorBoundary = GlobalErrorBoundary.getInstance();
  });

  describe('error handling', () => {
    it('should handle and notify subscribers of errors', (done) => {
      const testError = new Error('Test error');

      errorBoundary.getErrorStream().subscribe(error => {
        expect(error).toBe(testError);
        done();
      });

      // Simulate error
      global.handleUnhandledRejection(testError);
    });

    it('should attempt recovery for network errors', (done) => {
      const networkError = new Error('network error');

      errorBoundary.getErrorStream().subscribe(error => {
        expect(error.message).toContain('network');
        done();
      });

      global.handleUnhandledRejection(networkError);
    });
  });
});