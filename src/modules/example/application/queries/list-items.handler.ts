import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListItemsQuery } from './list-items.query';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';

@QueryHandler(ListItemsQuery)
export class ListItemsHandler implements IQueryHandler<ListItemsQuery> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(_query: ListItemsQuery): Promise<Item[]> {
    return this.itemRepository.findAll();
  }
}
