import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateItemCommand } from './create-item.command';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';
import { Item } from '../../domain/item.entity';
import { ItemName } from '../../domain/item-name.value-object';

@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(command: CreateItemCommand): Promise<string> {
    const id = crypto.randomUUID();
    const item = Item.create(id, ItemName.create(command.name));
    await this.itemRepository.save(item);
    return id;
  }
}
