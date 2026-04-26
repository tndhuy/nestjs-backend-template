"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppException = void 0;
const common_1 = require("@nestjs/common");
class AppException extends common_1.HttpException {
    code;
    details;
    constructor(payload) {
        super(payload, payload.statusCode);
        this.code = payload.code;
        this.details = payload.details;
    }
}
exports.AppException = AppException;
//# sourceMappingURL=app.exception.js.map