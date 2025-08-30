export default () => ({
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/i-do-easy',
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    globalPrefix: 'api/v1',
    port: parseInt(process.env.PORT || '3000', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: parseInt(process.env.JWT_EXPIRES || '1440', 10), // 24 hours in minutes (1440)
    // Maximum inactivity window in minutes before a session is considered expired due to inactivity
    maxInactiveMinutes: parseInt(
      process.env.JWT_MAX_INACTIVE_MINUTES || '180',
      10,
    ),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  admin: {
    email: process.env.USER_ADMIN || 'admin@entech.io',
    password: process.env.USER_PASSWORD || '123@Change$',
  },
  swagger: {
    title: 'Enhance API',
    description: 'iDoEasy API Documentation',
    version: '1.0',
    contact: {
      name: 'iDoEasy Tech',
      email: 'support@idowasy.net',
      url: 'https://www.idowasy.net',
    },
    license: {
      name: 'UNLICENSED',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Users', description: 'User management endpoints' },
      { name: 'Roles', description: 'Role management endpoints' },
      { name: 'Health', description: 'Health check endpoints' },
      { name: 'Permissions', description: 'Permissions endpoints' },
      { name: 'Me', description: 'Me endpoints' },
      { name: 'Sessions', description: 'Sessions endpoints' },
      { name: 'Organizations', description: 'Organizations endpoints' },
      { name: 'Audit Logs', description: 'Audit logs endpoints' },
    ],
    security: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
      },
    },
    externalDocs: {
      description: 'Find more info here',
      url: 'https://docs.idowasy.net',
    },
  },
});
