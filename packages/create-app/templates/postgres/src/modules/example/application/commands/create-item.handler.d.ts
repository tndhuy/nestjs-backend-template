import { ICommandHandler } from '@nestjs/cqrs';
import { CreateItemCommand } from './create-item.command';
import { IItemRepository } from '../../domain/item.repository.interface';
export declare class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
    private readonly itemRepository;
    constructor(itemRepository: IItemRepository);
    execute(command: CreateItemCommand): Promise<string>;
}
