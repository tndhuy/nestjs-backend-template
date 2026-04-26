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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const terminus_1 = require("@nestjs/terminus");
const swagger_1 = require("@nestjs/swagger");
const prisma_health_indicator_1 = require("./prisma.health-indicator");
const redis_health_indicator_1 = require("./redis.health-indicator");
const common_2 = require("../../common");
let HealthController = class HealthController {
    health;
    db;
    redis;
    constructor(health, db, redis) {
        this.health = health;
        this.db = db;
        this.redis = redis;
    }
    check() {
        return this.health.check([
            () => this.db.isHealthy('database'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
    ready() {
        return this.health.check([
            () => this.db.isHealthy('database'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
    live() {
        return this.health.check([]);
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, terminus_1.HealthCheck)(),
    (0, common_2.RawResponse)(),
    (0, swagger_1.ApiOperation)({ summary: 'Overall health check' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "check", null);
__decorate([
    (0, common_1.Get)('ready'),
    (0, terminus_1.HealthCheck)(),
    (0, common_2.RawResponse)(),
    (0, swagger_1.ApiOperation)({ summary: 'Readiness probe' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "ready", null);
__decorate([
    (0, common_1.Get)('live'),
    (0, terminus_1.HealthCheck)(),
    (0, common_2.RawResponse)(),
    (0, swagger_1.ApiOperation)({ summary: 'Liveness probe' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "live", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [terminus_1.HealthCheckService, typeof (_a = typeof prisma_health_indicator_1.PrismaHealthIndicator !== "undefined" && prisma_health_indicator_1.PrismaHealthIndicator) === "function" ? _a : Object, redis_health_indicator_1.RedisHealthIndicator])
], HealthController);
//# sourceMappingURL=health.controller.js.map