import { ValidationError, ValidationPipeOptions } from '@nestjs/common';
import { AppException } from './exceptions/app.exception';
import { ErrorCodes } from './exceptions/error-codes';

function formatErrors(errors: ValidationError[]): { field: string; constraints: Record<string, string> }[] {
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
        constraints: (error.constraints ?? {}) as Record<string, string>,
      },
    ];
  });
}

export const validationOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  exceptionFactory: (errors: ValidationError[]) => {
    const formattedErrors = formatErrors(errors);
    return new AppException({
      code: ErrorCodes.VALIDATION_FAILED,
      message: 'Validation failed',
      statusCode: 400,
      details: formattedErrors,
    });
  },
};
