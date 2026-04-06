import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';
import { ItemSchemaClass, ItemDocument } from './schemas/item.schema';

@Injectable()
export class MongooseItemRepository implements IItemRepository {
  constructor(
    @InjectModel(ItemSchemaClass.name)
    private readonly itemModel: Model<ItemDocument>,
  ) {}

  async findById(id: string): Promise<Item | null> {
    const record = await this.itemModel.findById(id).lean().exec();
    if (!record) return null;
    return Item.create(record._id as string, ItemName.create(record.name));
  }

  async findAll(): Promise<Item[]> {
    const records = await this.itemModel.find().lean().exec();
    return records.map((r) =>
      Item.create(r._id as string, ItemName.create(r.name)),
    );
  }

  async save(item: Item): Promise<void> {
    await this.itemModel
      .findByIdAndUpdate(
        item.id,
        { name: item.name.value },
        { upsert: true, new: true },
      )
      .exec();
  }

  async delete(id: string): Promise<void> {
    await this.itemModel.findByIdAndDelete(id).exec();
  }
}
