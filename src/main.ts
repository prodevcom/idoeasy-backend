import { SwaggerSetup } from '@entech/utils';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

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
}
bootstrap();
