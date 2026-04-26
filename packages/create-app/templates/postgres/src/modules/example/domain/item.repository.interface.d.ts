import { Item } from './item.entity';
export declare const ITEM_REPOSITORY: unique symbol;
export interface IItemRepository {
    findById(id: string): Promise<Item | null>;
    findAll(): Promise<Item[]>;
    save(item: Item): Promise<void>;
    delete(id: string): Promise<void>;
}
