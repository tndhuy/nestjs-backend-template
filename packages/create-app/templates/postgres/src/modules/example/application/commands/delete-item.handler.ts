import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { DeleteItemCommand } from './delete-item.command';
import { ITEM_REPOSITORY, IItemRepository } from '../../domain/item.repository.interface';

@CommandHandler(DeleteItemCommand)
export class DeleteItemHandler implements ICommandHandler<DeleteItemCommand> {
  constructor(
    @Inject(ITEM_REPOSITORY) private readonly itemRepository: IItemRepository,
  ) {}

  async execute(command: DeleteItemCommand): Promise<void> {
    await this.itemRepository.delete(command.id);
  }
}
