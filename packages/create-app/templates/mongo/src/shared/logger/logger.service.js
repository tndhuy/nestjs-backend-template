"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
let LoggerService = LoggerService_1 = class LoggerService {
    logger;
    context = LoggerService_1.name;
    constructor(logger) {
        this.logger = logger;
    }
    log(message, contextOrMetadata) {
        const metadata = this.normalizeMetadata(contextOrMetadata);
        this.logger.info(metadata, message);
    }
    error(message, traceOrMetadata, context) {
        let metadata;
        if (typeof traceOrMetadata === 'string') {
            metadata = { trace: traceOrMetadata, context: context || this.context };
        }
        else {
            metadata = this.normalizeMetadata(traceOrMetadata);
        }
        this.logger.error(metadata, message);
    }
    warn(message, contextOrMetadata) {
        const metadata = this.normalizeMetadata(contextOrMetadata);
        this.logger.warn(metadata, message);
    }
    debug(message, contextOrMetadata) {
        const metadata = this.normalizeMetadata(contextOrMetadata);
        this.logger.debug(metadata, message);
    }
    setContext(context) {
        this.context = context;
        return this;
    }
    normalizeMetadata(contextOrMetadata) {
        if (!contextOrMetadata)
            return { context: this.context };
        if (typeof contextOrMetadata === 'string')
            return { context: contextOrMetadata };
        return { context: this.context, ...contextOrMetadata };
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, nestjs_pino_1.InjectPinoLogger)(LoggerService.name)),
    __metadata("design:paramtypes", [nestjs_pino_1.PinoLogger])
], LoggerService);
//# sourceMappingURL=logger.service.js.map