<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# iDoEasy SaaS Integrations Backend

A NestJS backend application with MongoDB integration, class validation, standardized JSON responses, comprehensive error handling, full test coverage, and advanced Swagger documentation.

## Features

- 🗄️ **MongoDB Integration** - Using Mongoose ODM
- ✅ **Class Validation** - Request validation with class-validator
- 🔄 **Class Transform** - Automatic data transformation
- 📊 **Standardized JSON Responses** - Consistent API response format with pagination
- 🛡️ **Global Error Handling** - Comprehensive exception filtering
- ⚙️ **Modular Architecture** - Clean separation of concerns
- 🔒 **CORS Support** - Cross-origin resource sharing enabled
- 📚 **Advanced Swagger Documentation** - Interactive API documentation with decorators
- 🧪 **Unit Tests** - Full test coverage for all modules
- 📄 **Pagination Support** - Built-in pagination with search and filtering

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your environment variables in `.env`:
```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/i-do-easy

# Application Configuration
NODE_ENV=development
PORT=3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES=1440

# Admin User
USER_ADMIN=admin@entech.io
USER_PASSWORD=123@Change$

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
```

## Docker

### Quick Start with Docker

The project includes Docker support for easy development and deployment:

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build and run manually
docker build -t idoeasy-backend:latest .
docker run --env-file .env -p 3000:3000 idoeasy-backend:latest
```

### Docker Features

- 🐳 **Single .env file** - All environment variables in one place
- 🚀 **MongoDB Atlas ready** - Configured for cloud MongoDB
- 🔐 **SSH key support** - For private repository access during build
- 📦 **ECR deployment** - Ready for AWS ECR deployment (default: 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend)
- 🧹 **Optimized build** - Multi-stage build with cleanup

### Docker Commands

```bash
# Development
docker-compose up --build

# Production build
docker build -t idoeasy-backend:latest .

# ECR deployment (default: 800572458310.dkr.ecr.us-east-1.amazonaws.com/idoeasy-backend)
./scripts/build-ecr.sh
# Or custom repository
./scripts/build-ecr.sh <ECR_URL> <TAG>

# View logs
docker-compose logs -f app
```

📖 **For detailed Docker documentation, see [docs/DOCKER.md](docs/DOCKER.md)**

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

### Testing
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific module tests
npm test -- --testPathPattern=users
```

## API Documentation

### Swagger UI
Access the interactive API documentation at: `http://localhost:3000/api/docs`

The documentation includes:
- Complete endpoint descriptions with standardized decorators
- Request/response schemas with proper typing
- Example requests and responses
- Interactive testing interface
- Pagination and filtering documentation

## API Endpoints

The API is available at `http://localhost:3000/api/v1/`

### Available Endpoints

- `GET /` - API status
- `GET /health` - Health check
- `GET /users` - Get all users (with pagination and filtering)
- `POST /users` - Create user
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Query Parameters for Users List

- `page` - Page number (default: 1, min: 1)
- `limit` - Items per page (default: 25, min: 1, max: 100)
- `search` - Search term for name or email
- `status` - Filter by user status (`ACTIVE`, `INACTIVE`, `PROVISIONED`)

## Response Format

All API responses follow a standardized format:

### Success Response (Single Item)
```json
{
  "status": {
    "status": "success",
    "message": "Operation completed successfully",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users"
  },
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "status": "ACTIVE",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Success Response (List with Pagination)
```json
{
  "status": {
    "status": "success",
    "message": "Users retrieved successfully",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users"
  },
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "status": "ACTIVE",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Error Response
```json
{
  "status": {
    "status": "error",
    "message": "Error description",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/v1/users"
  },
  "data": null
}
```

## Project Structure

```
src/
├── common/
│   ├── dto/           # Data Transfer Objects
│   ├── filters/       # Exception filters
│   ├── interceptors/  # Response transformers
│   ├── schemas/       # MongoDB schemas
│   └── decorators/    # Custom Swagger decorators
├── config/            # Configuration files
├── modules/
│   ├── config/        # Configuration module
│   ├── database/      # Database module
│   ├── health/        # Health check module
│   └── users/         # Users module
└── main.ts           # Application entry point
```

## Modules

### ConfigModule
Centralized configuration management using NestJS ConfigModule.

### DatabaseModule
MongoDB connection and schema registration for global access.

### HealthModule
System health monitoring and status checks.

### UsersModule
Complete CRUD operations for user management with pagination, search, and filtering.

## Advanced Features

### Custom Swagger Decorator
The application uses a custom `@ApiSwaggerDocs` decorator for standardized API documentation:

```typescript
@ApiSwaggerDocs({
  operation: {
    summary: 'Get all users with pagination',
    description: 'Retrieves a paginated list of users with optional filtering',
    tags: ['users'],
  },
  responses: [
    {
      status: 200,
      model: UserResponse,
      type: 'list',
      description: 'Users retrieved successfully',
    },
  ],
})
```

### Pagination and Filtering
Built-in pagination with search and filtering capabilities:

```typescript
// Example query
GET /api/v1/users?page=1&limit=10&search=john&status=ACTIVE
```

## Testing

### Test Coverage
- **UsersService**: 91.3% statement coverage
- **UsersController**: 100% statement coverage
- **DTOs**: 100% statement coverage
- **Schemas**: 100% statement coverage

### Test Structure
```
src/modules/users/
├── users.service.spec.ts    # Service unit tests
├── users.controller.spec.ts # Controller unit tests
└── users.module.ts         # Module configuration
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:cov

# Run specific module tests
npm test -- --testPathPattern=users

# Run tests in watch mode
npm run test:watch
```

## Validation

The application uses class-validator for request validation. Example DTO:

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

## Database Schema Example

```typescript
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, minlength: 2, maxlength: 50 })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true, minlength: 6 })
  password: string;
}
```

## Error Handling

The application includes a global exception filter that:
- Catches all exceptions
- Logs errors with context
- Returns standardized error responses
- Handles validation errors gracefully

## Contributing

1. Follow the existing code style
2. Add tests for new features (aim for 90%+ coverage)
3. Update documentation as needed
4. Use conventional commits
5. Ensure all tests pass before submitting
6. Use the custom Swagger decorator for new endpoints

## License

This project is licensed under the MIT License.
