"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DateValueObject = void 0;
const value_object_1 = require("../base/value-object");
class DateValueObject extends value_object_1.ValueObject {
    constructor(value) {
        if (!(value instanceof Date) || isNaN(value.getTime())) {
            throw new Error('Date value must be a valid Date');
        }
        super({ value });
    }
    get value() {
        return this.props.value;
    }
}
exports.DateValueObject = DateValueObject;
//# sourceMappingURL=date.valueobject.js.map