# API Guide - iDoEasy SaaS Integrations Backend

## Overview

This guide explains how to use the configured NestJS backend with MongoDB, validation, and standardized responses.

## Quick Start

1. **Start the application:**
   ```bash
   npm run start:dev
   ```

2. **Test the health endpoint:**
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

## API Response Format

All endpoints return responses in this standardized format:

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Your actual data here
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Available Endpoints

### 1. Health Check
```bash
GET /api/v1/health
```

**Response:**
```json
{
  "success": true,
  "message": "Health check successful",
  "data": {
    "status": "OK",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/health"
}
```

### 2. Create User (with validation)
```bash
POST /api/v1/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "description": "Optional description"
}
```

**Validation Rules:**
- `name`: String, 2-50 characters
- `email`: Valid email format
- `password`: String, 6-100 characters
- `description`: Optional string, max 200 characters

**Success Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "description": "Optional description"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

**Validation Error Response:**
```json
{
  "success": false,
  "message": "email must be an email, password must be longer than or equal to 6 characters",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/users"
}
```

### 3. Get User by ID
```bash
GET /api/v1/users/123
```

**Response:**
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": 123,
    "message": "User with ID 123 retrieved successfully"
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/users/123"
}
```

## Creating New DTOs

To create a new DTO with validation:

```typescript
import { IsString, IsEmail, IsOptional, MinLength, MaxLength, IsNumber, IsBoolean } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateProductDto {
  @Expose()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Expose()
  @IsString()
  @MaxLength(500)
  description: string;

  @Expose()
  @IsNumber()
  price: number;

  @Expose()
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

## Creating MongoDB Schemas

To create a new MongoDB schema:

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true, minlength: 2, maxlength: 100 })
  name: string;

  @Prop({ maxlength: 500 })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
```

## MongoDB Configuration

The application uses the latest MongoDB driver with optimized connection settings:

```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => ({
    uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/i-do-easy',
  }),
  inject: [ConfigService],
}),
```

**Note:** The deprecated options `useNewUrlParser` and `useUnifiedTopology` have been removed as they are no longer needed in MongoDB Driver 4.0.0+.

## Error Handling

The application automatically handles various types of errors:

### Validation Errors
When request data doesn't match DTO validation rules:
```json
{
  "success": false,
  "message": "Validation failed: name must be longer than or equal to 2 characters",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

### Not Found Errors
When a resource is not found:
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

### Server Errors
When an unexpected error occurs:
```json
{
  "success": false,
  "message": "Internal server error",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/v1/endpoint"
}
```

## Environment Configuration

Create a `.env` file based on `.env.example`:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/i-do-easy

# Application Configuration
NODE_ENV=development
PORT=3000

# Logging
LOG_LEVEL=debug
```

## Testing the API

### Using curl
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Create user
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# Get user
curl http://localhost:3000/api/v1/users/1
```

### Using Postman
1. Import the collection
2. Set the base URL to `http://localhost:3000/api/v1`
3. Test the endpoints

## Best Practices

1. **Always use DTOs** for request validation
2. **Use the ApiResponseDto** for consistent responses
3. **Handle errors gracefully** - the global filter will catch them
4. **Validate input data** using class-validator decorators
5. **Use proper HTTP status codes** in your controllers
6. **Log important events** using the built-in logger

## Next Steps

1. Add authentication and authorization
2. Implement rate limiting
3. Add request/response logging
4. Set up automated testing
5. Configure production environment
6. Add API documentation with Swagger 