"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdValueObject = void 0;
const value_object_1 = require("../base/value-object");
class IdValueObject extends value_object_1.ValueObject {
    constructor(value) {
        if (!value || value.trim().length === 0) {
            throw new Error('ID must not be empty');
        }
        super({ value });
    }
    get value() {
        return this.props.value;
    }
}
exports.IdValueObject = IdValueObject;
//# sourceMappingURL=id.valueobject.js.map