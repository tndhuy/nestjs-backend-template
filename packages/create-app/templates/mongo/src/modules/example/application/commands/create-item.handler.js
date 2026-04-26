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
exports.CreateItemHandler = void 0;
const cqrs_1 = require("@nestjs/cqrs");
const common_1 = require("@nestjs/common");
const create_item_command_1 = require("./create-item.command");
const item_repository_interface_1 = require("../../domain/item.repository.interface");
const item_entity_1 = require("../../domain/item.entity");
const item_name_value_object_1 = require("../../domain/item-name.value-object");
let CreateItemHandler = class CreateItemHandler {
    itemRepository;
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async execute(command) {
        const id = crypto.randomUUID();
        const item = item_entity_1.Item.create(id, item_name_value_object_1.ItemName.create(command.name));
        await this.itemRepository.save(item);
        return id;
    }
};
exports.CreateItemHandler = CreateItemHandler;
exports.CreateItemHandler = CreateItemHandler = __decorate([
    (0, cqrs_1.CommandHandler)(create_item_command_1.CreateItemCommand),
    __param(0, (0, common_1.Inject)(item_repository_interface_1.ITEM_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], CreateItemHandler);
//# sourceMappingURL=create-item.handler.js.map