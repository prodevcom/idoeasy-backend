import { SwaggerSetup } from '@entech/utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { createCorsConfig } from './config/cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get PRIMARY_DOMAIN from configuration
  const primaryDomain =
    configService.get<string>('domain.primary') || 'idoeasy.net';

  // Apply CORS configuration
  const corsConfig = createCorsConfig(primaryDomain);
  app.enableCors(corsConfig);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  const globalPrefix =
    configService.get<string>('app.globalPrefix') || 'api/v1';

  app.setGlobalPrefix(globalPrefix);
  app.useGlobalPipes(new ZodValidationPipe());

  // Configure Swagger
  SwaggerSetup.configure(app);

  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  const logger = new Logger('Bootstrap');

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`🔒 CORS configured for domain: ${primaryDomain}`);
}
bootstrap();
