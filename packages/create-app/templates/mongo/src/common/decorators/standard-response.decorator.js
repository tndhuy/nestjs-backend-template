"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StandardResponse = exports.STANDARD_RESPONSE_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.STANDARD_RESPONSE_KEY = 'standard_response';
const StandardResponse = () => (0, common_1.SetMetadata)(exports.STANDARD_RESPONSE_KEY, true);
exports.StandardResponse = StandardResponse;
//# sourceMappingURL=standard-response.decorator.js.map