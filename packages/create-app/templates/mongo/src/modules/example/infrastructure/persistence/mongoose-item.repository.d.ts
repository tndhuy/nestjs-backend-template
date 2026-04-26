import { Model } from 'mongoose';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemDocument } from './schemas/item.schema';
export declare class MongooseItemRepository implements IItemRepository {
    private readonly itemModel;
    constructor(itemModel: Model<ItemDocument>);
    findById(id: string): Promise<Item | null>;
    findAll(): Promise<Item[]>;
    save(item: Item): Promise<void>;
    delete(id: string): Promise<void>;
}
