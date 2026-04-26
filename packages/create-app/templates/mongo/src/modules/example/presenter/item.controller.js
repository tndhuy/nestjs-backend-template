"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cqrs_1 = require("@nestjs/cqrs");
const create_item_dto_1 = require("../application/dtos/create-item.dto");
const item_response_dto_1 = require("../application/dtos/item.response.dto");
const create_item_command_1 = require("../application/commands/create-item.command");
const delete_item_command_1 = require("../application/commands/delete-item.command");
const get_item_query_1 = require("../application/queries/get-item.query");
const list_items_query_1 = require("../application/queries/list-items.query");
const shared_1 = require("../../../shared");
let ItemController = class ItemController {
    commandBus;
    queryBus;
    constructor(commandBus, queryBus) {
        this.commandBus = commandBus;
        this.queryBus = queryBus;
    }
    create(dto) {
        return this.commandBus.execute(new create_item_command_1.CreateItemCommand(dto.name));
    }
    delete(id) {
        return this.commandBus.execute(new delete_item_command_1.DeleteItemCommand(id));
    }
    findOne(id) {
        return this.queryBus.execute(new get_item_query_1.GetItemQuery(id));
    }
    findAll(pagination) {
        return this.queryBus.execute(new list_items_query_1.ListItemsQuery());
    }
};
exports.ItemController = ItemController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new item' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Item created successfully', type: item_response_dto_1.ItemResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Validation failed' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_item_dto_1.CreateItemDto]),
    __metadata("design:returntype", void 0)
], ItemController.prototype, "create", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an item by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Item UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item deleted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemController.prototype, "delete", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get an item by ID' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Item UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Item found', type: item_response_dto_1.ItemResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Item not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ItemController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all items with pagination' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of items', type: [item_response_dto_1.ItemResponseDto] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.PaginationDto]),
    __metadata("design:returntype", void 0)
], ItemController.prototype, "findAll", null);
exports.ItemController = ItemController = __decorate([
    (0, swagger_1.ApiTags)('example'),
    (0, common_1.Controller)('items'),
    __metadata("design:paramtypes", [cqrs_1.CommandBus,
        cqrs_1.QueryBus])
], ItemController);
//# sourceMappingURL=item.controller.js.map