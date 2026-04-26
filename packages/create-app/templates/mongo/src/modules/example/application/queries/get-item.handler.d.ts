import { IQueryHandler } from '@nestjs/cqrs';
import { GetItemQuery } from './get-item.query';
import { IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
export declare class GetItemHandler implements IQueryHandler<GetItemQuery> {
    private readonly itemRepository;
    constructor(itemRepository: IItemRepository);
    execute(query: GetItemQuery): Promise<Item | null>;
}
