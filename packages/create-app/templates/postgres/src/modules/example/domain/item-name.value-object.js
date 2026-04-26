"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemName = void 0;
const value_object_1 = require("../../../shared/base/value-object");
class ItemName extends value_object_1.ValueObject {
    static create(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('ItemName cannot be empty');
        }
        return new ItemName({ value: value.trim() });
    }
    get value() {
        return this.props.value;
    }
}
exports.ItemName = ItemName;
//# sourceMappingURL=item-name.value-object.js.map