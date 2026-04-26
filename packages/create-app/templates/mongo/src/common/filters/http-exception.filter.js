"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var HttpExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const app_exception_1 = require("../../shared/exceptions/app.exception");
let HttpExceptionFilter = HttpExceptionFilter_1 = class HttpExceptionFilter {
    logger = new common_1.Logger(HttpExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let code;
        let message;
        let statusCode;
        let details = null;
        if (exception instanceof app_exception_1.AppException) {
            code = exception.code;
            message = exception.message;
            statusCode = exception.getStatus();
            details = exception.details ?? null;
        }
        else {
            statusCode = exception.getStatus();
            code = common_1.HttpStatus[statusCode] ?? 'UNKNOWN_ERROR';
            message = exception.message;
        }
        this.logger.error(`[${request.method}] ${request.url} - ${statusCode} ${code}: ${message}`);
        response.status(statusCode).json({
            success: false,
            error: {
                code,
                message,
                statusCode,
                details,
            },
        });
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = HttpExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map