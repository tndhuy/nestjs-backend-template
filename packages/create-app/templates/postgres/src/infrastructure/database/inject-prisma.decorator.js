"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InjectPrisma = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma.service");
const InjectPrisma = () => (0, common_1.Inject)(prisma_service_1.PrismaService);
exports.InjectPrisma = InjectPrisma;
//# sourceMappingURL=inject-prisma.decorator.js.map