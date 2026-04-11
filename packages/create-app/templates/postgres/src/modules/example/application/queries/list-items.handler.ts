import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListItemsQuery } from './list-items.query';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { PaginationMeta } from '../../../shared/dto/pagination.dto';

@QueryHandler(ListItemsQuery)
export class ListItemsHandler implements IQueryHandler<ListItemsQuery> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(_query: ListItemsQuery): Promise<{ items: Item[]; meta: PaginationMeta }> {
    const items = await this.itemRepository.findAll();
    
    // Example metadata — in a real app, these values would come from the database query
    const meta: PaginationMeta = {
      total: items.length,
      page: 1,
      limit: 20,
      totalPages: Math.ceil(items.length / 20) || 1,
    };

    return { items, meta };
  }
}
