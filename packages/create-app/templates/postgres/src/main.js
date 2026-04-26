"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const instrumentation_1 = __importDefault(require("./instrumentation"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const nestjs_pino_1 = require("nestjs-pino");
const nestjs_api_reference_1 = require("@scalar/nestjs-api-reference");
const express_basic_auth_1 = __importDefault(require("express-basic-auth"));
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const timeout_interceptor_1 = require("./common/interceptors/timeout.interceptor");
const validation_options_1 = require("./shared/validation-options");
async function bootstrap() {
    instrumentation_1.default?.start();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    app.set('trust proxy', 1);
    const apiVersion = process.env.API_VERSION ?? '1';
    app.setGlobalPrefix('api', {
        exclude: ['/health', '/health/ready', '/health/live'],
    });
    app.enableVersioning({ type: common_1.VersioningType.URI, defaultVersion: apiVersion });
    app.useGlobalPipes(new common_1.ValidationPipe(validation_options_1.validationOptions));
    const reflector = app.get(core_1.Reflector);
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor(reflector), new timeout_interceptor_1.TimeoutInterceptor());
    const documentBuilder = new swagger_1.DocumentBuilder()
        .setTitle(process.env.APP_NAME ?? 'NestJS Backend Template')
        .setDescription(process.env.APP_DESCRIPTION ?? 'API Documentation')
        .setVersion(apiVersion)
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, documentBuilder);
    swagger_1.SwaggerModule.setup('docs/json', app, document, {
        jsonDocumentUrl: '/docs/json',
    });
    const docsUser = process.env.DOCS_USER ?? 'admin';
    const docsPass = process.env.DOCS_PASS ??
        (process.env.NODE_ENV === 'production' ? undefined : 'admin');
    if (docsPass) {
        app.use('/docs', (0, express_basic_auth_1.default)({ users: { [docsUser]: docsPass }, challenge: true }));
    }
    app.use('/docs', (0, nestjs_api_reference_1.apiReference)({
        content: document,
        spec: { content: document },
        hiddenClients: ['fetch', 'xhr'],
        configuration: { agent: { disabled: true } },
    }));
    const port = parseInt(process.env.PORT ?? '3000', 10);
    await app.listen(port);
    const logger = app.get(nestjs_pino_1.Logger);
    logger.log(`Application running on http://localhost:${port}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map