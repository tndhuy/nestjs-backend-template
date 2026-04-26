"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Item = void 0;
const aggregate_root_1 = require("../../../shared/base/aggregate-root");
class Item extends aggregate_root_1.AggregateRoot {
    _name;
    constructor(id, name) {
        super(id);
        this._name = name;
    }
    static create(id, name) {
        return new Item(id, name);
    }
    get name() {
        return this._name;
    }
}
exports.Item = Item;
//# sourceMappingURL=item.entity.js.map