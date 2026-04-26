"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationOptions = void 0;
const app_exception_1 = require("./exceptions/app.exception");
const error_codes_1 = require("./exceptions/error-codes");
function formatErrors(errors) {
    return errors.flatMap((error) => {
        if (error.children && error.children.length > 0) {
            return formatErrors(error.children).map((child) => ({
                ...child,
                field: `${error.property}.${child.field}`,
            }));
        }
        return [
            {
                field: error.property,
                constraints: (error.constraints ?? {}),
            },
        ];
    });
}
exports.validationOptions = {
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
        enableImplicitConversion: true,
    },
    exceptionFactory: (errors) => {
        const formattedErrors = formatErrors(errors);
        return new app_exception_1.AppException({
            code: error_codes_1.ErrorCodes.VALIDATION_FAILED,
            message: 'Validation failed',
            statusCode: 400,
            details: formattedErrors,
        });
    },
};
//# sourceMappingURL=validation-options.js.map