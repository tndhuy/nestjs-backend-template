import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemController } from './presenter/item.controller';
import { CreateItemHandler } from './application/commands/create-item.handler';
import { DeleteItemHandler } from './application/commands/delete-item.handler';
import { GetItemHandler } from './application/queries/get-item.handler';
import { ListItemsHandler } from './application/queries/list-items.handler';
import { MongooseItemRepository } from './infrastructure/persistence/mongoose-item.repository';
import { ItemSchemaClass, ItemSchema } from './infrastructure/persistence/schemas/item.schema';
import { ITEM_REPOSITORY } from './domain/item.repository.interface';

const CommandHandlers = [CreateItemHandler, DeleteItemHandler];
const QueryHandlers = [GetItemHandler, ListItemsHandler];

@Module({
  imports: [
    CqrsModule,
    MongooseModule.forFeature([{ name: ItemSchemaClass.name, schema: ItemSchema }]),
  ],
  controllers: [ItemController],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: ITEM_REPOSITORY,
      useClass: MongooseItemRepository,
    },
  ],
})
export class ExampleModule {}
