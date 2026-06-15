/**
 * Centralized configuration module.
 * All external connection strings and secrets are loaded from environment variables.
 */

export const config = {
  /** Server */
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  /** PostgreSQL / Prisma */
  databaseUrl: process.env.DATABASE_URL || '',

  /** Redis */
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  /** AWS S3 */
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    s3BucketName: process.env.S3_BUCKET_NAME || '',
  },

  /** SAML / MIT Touchstone */
  saml: {
    entryPoint: process.env.SAML_ENTRY_POINT || '',
    issuer: process.env.SAML_ISSUER || 'pyxis',
    callbackUrl: process.env.SAML_CALLBACK_URL || '',
    cert: process.env.SAML_CERT || '',
  },

  /** Session */
  session: {
    secret: process.env.SESSION_SECRET || 'pyxis-dev-secret',
    ttlSeconds: 28800, // 8 hours
  },
} as const;
