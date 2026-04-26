import { IQueryHandler } from '@nestjs/cqrs';
import { ListItemsQuery } from './list-items.query';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
export declare class ListItemsHandler implements IQueryHandler<ListItemsQuery> {
    private readonly itemRepository;
    constructor(itemRepository: IItemRepository);
    execute(_query: ListItemsQuery): Promise<Item[]>;
}
