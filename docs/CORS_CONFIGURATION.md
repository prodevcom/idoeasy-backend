# CORS Configuration Guide

## Overview

This project implements a secure CORS (Cross-Origin Resource Sharing) configuration using the `coreDelegate` pattern to ensure that only authorized domains can access the API in production.

## Configuration Files

### 1. `src/config/cors.config.ts`

This file contains the CORS configuration logic with the following features:

- **Production Mode**: Only allows requests from `PRIMARY_DOMAIN` and its subdomains
- **Development Mode**: Allows localhost and common development origins
- **Security**: Blocks unauthorized origins with detailed logging
- **Flexibility**: Uses environment variables for configuration

### 2. `src/config/configuration.ts`

Added a new `domain.primary` configuration that reads from `PRIMARY_DOMAIN` environment variable.

### 3. `src/main.ts`

Updated to use the new CORS configuration instead of hardcoded values.

## Environment Variables

Set the following environment variable in your `.env` file:

```bash
PRIMARY_DOMAIN=yourdomain.com
```

## How It Works

### Production Environment

When `NODE_ENV=production`:

1. Only requests from `PRIMARY_DOMAIN` and its subdomains are allowed
2. Examples:
   - `https://yourdomain.com` ✅
   - `https://www.yourdomain.com` ✅
   - `https://api.yourdomain.com` ✅
   - `https://app.yourdomain.com` ✅
   - `https://malicious.com` ❌ (Blocked)
   - `https://fake.yourdomain.com` ❌ (Blocked - not a subdomain)

### Development Environment

When `NODE_ENV=development`:

1. Allows localhost origins for local development
2. Allows the configured `PRIMARY_DOMAIN` for testing
3. Common development ports are supported

## Security Features

- **Origin Validation**: Strict validation of request origins
- **Logging**: All blocked requests are logged with details
- **Error Handling**: Graceful handling of invalid origin formats
- **Subdomain Protection**: Only allows legitimate subdomains of your primary domain

## Usage Examples

### Basic Usage

```typescript
import { createCorsConfig } from './config/cors.config';

const corsConfig = createCorsConfig('yourdomain.com');
app.enableCors(corsConfig);
```

### With Configuration Service

```typescript
import { ConfigService } from '@nestjs/config';
import { createCorsConfig } from './config/cors.config';

const primaryDomain = configService.get<string>('domain.primary');
const corsConfig = createCorsConfig(primaryDomain);
app.enableCors(corsConfig);
```

### Factory Pattern (Advanced)

```typescript
import { corsConfigFactory } from './config/cors.config';

// Use in module providers
providers: [
  {
    provide: 'CORS_CONFIG',
    useFactory: (primaryDomain: string) => createCorsConfig(primaryDomain),
    inject: ['PRIMARY_DOMAIN']
  }
]
```

## Testing CORS

### Test Allowed Origins

```bash
# Should work
curl -H "Origin: https://yourdomain.com" http://localhost:3000/api/v1/health

# Should work
curl -H "Origin: https://api.yourdomain.com" http://localhost:3000/api/v1/health

# Should be blocked
curl -H "Origin: https://malicious.com" http://localhost:3000/api/v1/health
```

### Test with Browser

1. Open browser console on an allowed domain
2. Make a request to your API
3. Check that CORS headers are present
4. Verify that blocked domains show CORS errors

## Troubleshooting

### Common Issues

1. **CORS errors in production**: Check that `PRIMARY_DOMAIN` is set correctly
2. **Development not working**: Ensure `NODE_ENV` is not set to 'production'
3. **Subdomain issues**: Verify the subdomain is actually a subdomain of your primary domain

### Debug Mode

Enable debug logging by setting:

```bash
LOG_LEVEL=debug
```

This will show detailed CORS validation logs.

## Migration from Old Configuration

If you're migrating from the old hardcoded CORS configuration:

1. The new configuration is automatically applied
2. No changes needed in your application code
3. Just set the `PRIMARY_DOMAIN` environment variable
4. The old CORS configuration in `main.ts` has been replaced

## Best Practices

1. **Always use environment variables** for domain configuration
2. **Test in production-like environments** before deploying
3. **Monitor CORS logs** for unauthorized access attempts
4. **Regularly review allowed domains** and remove unused ones
5. **Use HTTPS in production** for secure communication

## Support

For issues or questions about CORS configuration:

1. Check the application logs for CORS-related errors
2. Verify environment variable configuration
3. Test with different origins to isolate the issue
4. Review the security logs for blocked requests
