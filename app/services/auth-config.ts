export const AUTH_CONFIG = {
  SIGN_IN_REDIRECT: '/pages/home/home-page',
  SIGN_OUT_REDIRECT: '/pages/auth/login-page',
  PASSWORD_RECOVERY_REDIRECT: '/pages/auth/reset-password-page',
  MIN_PASSWORD_LENGTH: 8,
  SESSION_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
  REFRESH_TOKEN_THRESHOLD: 60 * 60 * 1000, // 1 hour
  AUTH_PERSISTENCE_KEY: 'gaming_platform_auth'
};