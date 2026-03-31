import { Inject } from '@nestjs/common';
import { PrismaService } from './prisma.service';

export const InjectPrisma = () => Inject(PrismaService);
