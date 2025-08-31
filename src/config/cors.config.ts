import { CorsOptions } from 'cors';

export const createCorsConfig = (primaryDomain: string): CorsOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    // Production: Only allow PRIMARY_DOMAIN and its subdomains
    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allow: boolean) => void,
      ): void => {
        // Allow requests with no origin (like mobile apps or Postman)
        if (!origin) {
          callback(null, true);
          return;
        }

        try {
          const url = new URL(origin);
          const hostname = url.hostname;

          // Check if origin matches PRIMARY_DOMAIN or its subdomains
          const isAllowed =
            hostname === primaryDomain ||
            hostname.endsWith(`.${primaryDomain}`);

          if (isAllowed) {
            callback(null, true);
          } else {
            console.warn(
              `CORS blocked request from unauthorized origin: ${origin}`,
            );
            callback(
              new Error(`Origin ${origin} not allowed by CORS policy`),
              false,
            );
          }
        } catch (error) {
          console.error(`Invalid origin format: ${origin}`, error);
          callback(new Error('Invalid origin format'), false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
      ],
      exposedHeaders: [
        'Content-Range',
        'X-Total-Count',
        'X-Requested-With',
        'X-File-Name',
      ],
      maxAge: 86400, // 24 hours
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  } else {
    // Development: Allow localhost and common dev origins
    return {
      origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:8080',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:8080',
        // Allow PRIMARY_DOMAIN in development for testing
        `https://${primaryDomain}`,
        `https://www.${primaryDomain}`,
        `https://api.${primaryDomain}`,
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'Cache-Control',
        'X-File-Name',
      ],
      exposedHeaders: [
        'Content-Range',
        'X-Total-Count',
        'X-Requested-With',
        'X-File-Name',
      ],
      maxAge: 86400,
      preflightContinue: false,
      optionsSuccessStatus: 204,
    };
  }
};

// CORS configuration factory using coreDelegate pattern
export const corsConfigFactory = {
  provide: 'CORS_CONFIG',
  useFactory: (primaryDomain: string) => createCorsConfig(primaryDomain),
  inject: ['PRIMARY_DOMAIN'],
};

// Default CORS options for immediate use
export const defaultCorsOptions: CorsOptions = {
  origin: false, // Will be overridden by the factory
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Cache-Control',
    'X-File-Name',
  ],
  exposedHeaders: [
    'Content-Range',
    'X-Total-Count',
    'X-Requested-With',
    'X-File-Name',
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
