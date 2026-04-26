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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaItemRepository = void 0;
const common_1 = require("@nestjs/common");
const inject_prisma_decorator_1 = require("../../../../infrastructure/database/inject-prisma.decorator");
const prisma_service_1 = require("../../../../infrastructure/database/prisma.service");
const item_entity_1 = require("../../domain/item.entity");
const item_name_value_object_1 = require("../../domain/item-name.value-object");
let PrismaItemRepository = class PrismaItemRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findById(id) {
        const record = await this.prisma.item.findUnique({ where: { id } });
        if (!record)
            return null;
        return item_entity_1.Item.create(record.id, item_name_value_object_1.ItemName.create(record.name));
    }
    async findAll() {
        const records = await this.prisma.item.findMany();
        return records.map((r) => item_entity_1.Item.create(r.id, item_name_value_object_1.ItemName.create(r.name)));
    }
    async save(item) {
        await this.prisma.item.upsert({
            where: { id: item.id },
            update: { name: item.name.value },
            create: { id: item.id, name: item.name.value },
        });
    }
    async delete(id) {
        await this.prisma.item.delete({ where: { id } });
    }
};
exports.PrismaItemRepository = PrismaItemRepository;
exports.PrismaItemRepository = PrismaItemRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_prisma_decorator_1.InjectPrisma)()),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaItemRepository);
//# sourceMappingURL=prisma-item.repository.js.map