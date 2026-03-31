import { Item } from './item.entity';

export const ITEM_REPOSITORY = Symbol('IItemRepository');

export interface IItemRepository {
  findById(id: string): Promise<Item | null>;
  findAll(): Promise<Item[]>;
  save(item: Item): Promise<void>;
  delete(id: string): Promise<void>;
}
