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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseItemRepository = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const item_entity_1 = require("../../domain/item.entity");
const item_name_value_object_1 = require("../../domain/item-name.value-object");
const item_schema_1 = require("./schemas/item.schema");
let MongooseItemRepository = class MongooseItemRepository {
    itemModel;
    constructor(itemModel) {
        this.itemModel = itemModel;
    }
    async findById(id) {
        const record = await this.itemModel.findById(id).lean().exec();
        if (!record)
            return null;
        return item_entity_1.Item.create(record._id, item_name_value_object_1.ItemName.create(record.name));
    }
    async findAll() {
        const records = await this.itemModel.find().lean().exec();
        return records.map((r) => item_entity_1.Item.create(r._id, item_name_value_object_1.ItemName.create(r.name)));
    }
    async save(item) {
        await this.itemModel
            .findByIdAndUpdate(item.id, { name: item.name.value }, { upsert: true, new: true })
            .exec();
    }
    async delete(id) {
        await this.itemModel.findByIdAndDelete(id).exec();
    }
};
exports.MongooseItemRepository = MongooseItemRepository;
exports.MongooseItemRepository = MongooseItemRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(item_schema_1.ItemSchemaClass.name)),
    __metadata("design:paramtypes", [typeof (_a = typeof mongoose_2.Model !== "undefined" && mongoose_2.Model) === "function" ? _a : Object])
], MongooseItemRepository);
//# sourceMappingURL=mongoose-item.repository.js.map