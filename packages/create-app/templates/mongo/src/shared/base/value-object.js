"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValueObject = void 0;
class ValueObject {
    props;
    constructor(props) {
        this.props = Object.freeze({ ...props });
    }
    equals(other) {
        if (!other)
            return false;
        if (other === this)
            return true;
        return JSON.stringify(this.props) === JSON.stringify(other.props);
    }
}
exports.ValueObject = ValueObject;
//# sourceMappingURL=value-object.js.map