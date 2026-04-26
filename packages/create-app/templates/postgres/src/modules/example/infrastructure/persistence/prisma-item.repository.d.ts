import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
export declare class PrismaItemRepository implements IItemRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: string): Promise<Item | null>;
    findAll(): Promise<Item[]>;
    save(item: Item): Promise<void>;
    delete(id: string): Promise<void>;
}
