"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NumberValueObject = void 0;
const value_object_1 = require("../base/value-object");
class NumberValueObject extends value_object_1.ValueObject {
    constructor(value) {
        if (!Number.isFinite(value)) {
            throw new Error('Number value must be a finite number');
        }
        super({ value });
    }
    get value() {
        return this.props.value;
    }
}
exports.NumberValueObject = NumberValueObject;
//# sourceMappingURL=number.valueobject.js.map