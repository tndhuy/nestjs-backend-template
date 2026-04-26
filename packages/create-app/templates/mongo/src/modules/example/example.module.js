"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleModule = void 0;
const common_1 = require("@nestjs/common");
const cqrs_1 = require("@nestjs/cqrs");
const mongoose_1 = require("@nestjs/mongoose");
const item_controller_1 = require("./presenter/item.controller");
const create_item_handler_1 = require("./application/commands/create-item.handler");
const delete_item_handler_1 = require("./application/commands/delete-item.handler");
const get_item_handler_1 = require("./application/queries/get-item.handler");
const list_items_handler_1 = require("./application/queries/list-items.handler");
const mongoose_item_repository_1 = require("./infrastructure/persistence/mongoose-item.repository");
const item_schema_1 = require("./infrastructure/persistence/schemas/item.schema");
const item_repository_interface_1 = require("./domain/item.repository.interface");
const CommandHandlers = [create_item_handler_1.CreateItemHandler, delete_item_handler_1.DeleteItemHandler];
const QueryHandlers = [get_item_handler_1.GetItemHandler, list_items_handler_1.ListItemsHandler];
let ExampleModule = class ExampleModule {
};
exports.ExampleModule = ExampleModule;
exports.ExampleModule = ExampleModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cqrs_1.CqrsModule,
            mongoose_1.MongooseModule.forFeature([{ name: item_schema_1.ItemSchemaClass.name, schema: item_schema_1.ItemSchema }]),
        ],
        controllers: [item_controller_1.ItemController],
        providers: [
            ...CommandHandlers,
            ...QueryHandlers,
            {
                provide: item_repository_interface_1.ITEM_REPOSITORY,
                useClass: mongoose_item_repository_1.MongooseItemRepository,
            },
        ],
    })
], ExampleModule);
//# sourceMappingURL=example.module.js.map