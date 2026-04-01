import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetItemQuery } from './get-item.query';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';

@QueryHandler(GetItemQuery)
export class GetItemHandler implements IQueryHandler<GetItemQuery> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(query: GetItemQuery): Promise<Item | null> {
    return this.itemRepository.findById(query.id);
  }
}
