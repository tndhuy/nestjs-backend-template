import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { StandardResponse } from '../../../common/decorators/standard-response.decorator';
import { CreateItemDto } from '../application/dtos/create-item.dto';
import { ItemResponseDto } from '../application/dtos/item.response.dto';
import { CreateItemCommand } from '../application/commands/create-item.command';
import { DeleteItemCommand } from '../application/commands/delete-item.command';
import { GetItemQuery } from '../application/queries/get-item.query';
import { ListItemsQuery } from '../application/queries/list-items.query';
import { PaginationDto } from '../../../shared';

@ApiTags('example')
@StandardResponse()
@Controller('items')
export class ItemController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  @ApiResponse({ status: 201, description: 'Item created successfully', type: ItemResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateItemDto) {
    return this.commandBus.execute(new CreateItemCommand(dto.name));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item deleted successfully' })
  @ApiResponse({ status: 404, description: 'Item not found' })
  delete(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteItemCommand(id));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an item by ID' })
  @ApiParam({ name: 'id', description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Item found', type: ItemResponseDto })
  @ApiResponse({ status: 404, description: 'Item not found' })
  findOne(@Param('id') id: string) {
    return this.queryBus.execute(new GetItemQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List all items with pagination' })
  @ApiResponse({ status: 200, description: 'List of items', type: [ItemResponseDto] })
  findAll(@Query() pagination: PaginationDto) {
    return this.queryBus.execute(new ListItemsQuery());
  }
}
