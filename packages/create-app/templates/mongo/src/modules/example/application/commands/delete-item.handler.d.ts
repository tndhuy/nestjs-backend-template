import { ICommandHandler } from '@nestjs/cqrs';
import { DeleteItemCommand } from './delete-item.command';
import { IItemRepository } from '../../domain/item.repository.interface';
export declare class DeleteItemHandler implements ICommandHandler<DeleteItemCommand> {
    private readonly itemRepository;
    constructor(itemRepository: IItemRepository);
    execute(command: DeleteItemCommand): Promise<void>;
}
