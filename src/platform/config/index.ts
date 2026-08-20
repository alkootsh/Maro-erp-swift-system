/**
 * @file index.ts
 * @module Platform Configuration
 * @description Central Environment and Platform Runtime Configuration
 */

export const PlatformConfig = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  isProduction: process.env.NODE_ENV === 'production',
  
  database: {
    url: process.env.DATABASE_URL || '',
    isConfigured: Boolean(process.env.DATABASE_URL),
  },

  security: {
    jwtSecret: process.env.JWT_SECRET || process.env.SESSION_SECRET || 'MARO_PLATFORM_SECURE_JWT_SECRET_KEY_2026',
    offlineAuthSecret: process.env.OFFLINE_AUTH_SECRET || 'MARO_OFFLINE_PLATFORM_AUTH_SECRET',
    developerSigningKey: process.env.MARO_DEVELOPER_SIGNING_KEY || '',
  },

  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash',
  }
};
