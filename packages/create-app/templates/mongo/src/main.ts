import otelSdk from './instrumentation';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { VersioningType, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { apiReference } from '@scalar/nestjs-api-reference';
import basicAuth from 'express-basic-auth';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { validationOptions } from './shared/validation-options';
import { LoggerService } from './shared/logger/logger.service';

async function bootstrap() {
  otelSdk?.start();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.set('trust proxy', 1);

  const apiVersion = process.env.API_VERSION ?? '1';

  app.setGlobalPrefix('api', {
    exclude: ['/health', '/health/ready', '/health/live'],
  });

  app.enableVersioning({ type: VersioningType.URI, defaultVersion: apiVersion });

  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const reflector = app.get(Reflector);
  const loggerService = app.get(LoggerService);

  app.useGlobalFilters(new HttpExceptionFilter(loggerService));

  app.useGlobalInterceptors(
    new TransformInterceptor(reflector),
    new TimeoutInterceptor(),
  );

  // Swagger document
  const documentBuilder = new DocumentBuilder()
    .setTitle(process.env.APP_NAME ?? 'NestJS Backend Template')
    .setDescription(process.env.APP_DESCRIPTION ?? 'API Documentation')
    .setVersion(apiVersion)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, documentBuilder);

  // Serve raw spec at /docs/json
  SwaggerModule.setup('docs/json', app, document, {
    jsonDocumentUrl: '/docs/json',
  });

  // Basic auth for /docs
  const docsUser = process.env.DOCS_USER ?? 'admin';
  const docsPass =
    process.env.DOCS_PASS ??
    (process.env.NODE_ENV === 'production' ? undefined : 'admin');
  if (docsPass) {
    app.use(
      '/docs',
      basicAuth({ users: { [docsUser]: docsPass }, challenge: true }),
    );
  }

  // Scalar API reference at /docs
  app.use(
    '/docs',
    apiReference({
      content: document,
      spec: { content: document },
      hiddenClients: ['fetch', 'xhr'],
      configuration: { agent: { disabled: true } },
    }),
  );

  const port = parseInt(process.env.PORT ?? '3000', 10);
  const httpServer = await app.listen(port);

  process.on('SIGTERM', () => {
    loggerService.log('SIGTERM signal received: closing HTTP server');
    setTimeout(() => {
      void otelSdk?.shutdown().catch(() => undefined);
      httpServer.close(() => {
        loggerService.log('HTTP server closed');
        process.exit(0);
      });
    }, 15000);
  });

  const logger = app.get(Logger);
  logger.log(`Application running on http://localhost:${port}`);
}

void bootstrap();
