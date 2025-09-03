import { SwaggerConfig } from '@idoeasy/config';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export class SwaggerSetup {
  static configure(app: INestApplication): void {
    const configService = app.get(ConfigService);

    // Not available in production
    const env = configService.get<string>('app.environment');
    const logger = new Logger('SwaggerSetup');

    if (env !== 'development') {
      logger.log('Swagger is not available in production');
      return;
    }

    // Get Swagger configuration from config service
    const swaggerConfig = configService.get<SwaggerConfig>('swagger');
    const globalPrefix = configService.get<string>('app.globalPrefix') || 'api';
    const port = configService.get<number>('app.port');

    if (!swaggerConfig) {
      throw new Error('Swagger configuration not found');
    }

    // Create Swagger document configuration
    const builder = new DocumentBuilder()
      .setTitle(swaggerConfig.title)
      .setDescription(swaggerConfig.description)
      .setVersion(swaggerConfig.version)
      .setContact(
        swaggerConfig.contact.name,
        swaggerConfig.contact.url,
        swaggerConfig.contact.email,
      )
      .setLicense(swaggerConfig.license.name, swaggerConfig.license.url)
      // Add security schemes
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
      );

    // Add tags for organization
    swaggerConfig.tags.forEach((tag) => {
      builder.addTag(tag.name, tag.description);
    });

    const config = builder.build();

    // Create the Swagger document
    const document = SwaggerModule.createDocument(app, config);

    // Customize the document with additional metadata
    document.info.termsOfService = 'https://www.enhancetech.io/privacy-policy';

    // Setup Swagger UI with custom options
    const swaggerOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        tryItOutEnabled: true,
      },
      customSiteTitle: 'Enhance API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .info .title { color: #2c3e50; }
      `,
    };

    // Mount Swagger UI
    SwaggerModule.setup(`${globalPrefix}/docs`, app, document, swaggerOptions);

    // Also serve the JSON/YAML spec
    SwaggerModule.setup(`${globalPrefix}/docs-json`, app, document, {
      jsonDocumentUrl: `${globalPrefix}/docs/swagger.json`,
      yamlDocumentUrl: `${globalPrefix}/docs/swagger.yaml`,
    });

    logger.log(
      `📖 Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`,
    );
    logger.log(
      `📄 API spec (JSON): http://localhost:${port}/${globalPrefix}/docs/swagger.json`,
    );
    logger.log(
      `📄 API spec (YAML): http://localhost:${port}/${globalPrefix}/docs/swagger.yaml`,
    );
  }
}
