import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ItemController } from './presenter/item.controller';
import { CreateItemHandler } from './application/commands/create-item.handler';
import { DeleteItemHandler } from './application/commands/delete-item.handler';
import { GetItemHandler } from './application/queries/get-item.handler';
import { ListItemsHandler } from './application/queries/list-items.handler';
import { PrismaItemRepository } from './infrastructure/persistence/prisma-item.repository';
import { ITEM_REPOSITORY } from './domain/item.repository.interface';

const CommandHandlers = [CreateItemHandler, DeleteItemHandler];
const QueryHandlers = [GetItemHandler, ListItemsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [ItemController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: ITEM_REPOSITORY,
      useClass: PrismaItemRepository,
    },
  ],
})
export class ExampleModule {}
