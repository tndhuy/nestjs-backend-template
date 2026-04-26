"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringValueObject = void 0;
const value_object_1 = require("../base/value-object");
class StringValueObject extends value_object_1.ValueObject {
    constructor(value) {
        if (value === null || value === undefined) {
            throw new Error('String value must not be null or undefined');
        }
        super({ value });
    }
    get value() {
        return this.props.value;
    }
}
exports.StringValueObject = StringValueObject;
//# sourceMappingURL=string.valueobject.js.map