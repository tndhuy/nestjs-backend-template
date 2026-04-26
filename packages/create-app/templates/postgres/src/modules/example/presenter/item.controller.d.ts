import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateItemDto } from '../application/dtos/create-item.dto';
import { PaginationDto } from '../../../shared';
export declare class ItemController {
    private readonly commandBus;
    private readonly queryBus;
    constructor(commandBus: CommandBus, queryBus: QueryBus);
    create(dto: CreateItemDto): Promise<any>;
    delete(id: string): Promise<any>;
    findOne(id: string): Promise<any>;
    findAll(pagination: PaginationDto): Promise<any>;
}
