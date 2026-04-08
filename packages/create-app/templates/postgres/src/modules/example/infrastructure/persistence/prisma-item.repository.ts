import { Injectable } from '@nestjs/common';
import { InjectPrisma } from '../../../../infrastructure/database/inject-prisma.decorator';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';

@Injectable()
export class PrismaItemRepository implements IItemRepository {
  constructor(@InjectPrisma() private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Item | null> {
    const record = await this.prisma.item.findUnique({ where: { id } });
    if (!record) return null;
    return Item.create(record.id, ItemName.create(record.name));
  }

  async findAll(): Promise<Item[]> {
    const records = await this.prisma.item.findMany();
    return records.map((r) => Item.create(r.id, ItemName.create(r.name)));
  }

  async save(item: Item): Promise<void> {
    await this.prisma.item.upsert({
      where: { id: item.id },
      update: { name: item.name.value },
      create: { id: item.id, name: item.name.value },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.item.delete({ where: { id } });
  }
}
