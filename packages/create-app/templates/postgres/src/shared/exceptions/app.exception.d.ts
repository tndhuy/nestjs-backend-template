import { HttpException } from '@nestjs/common';
export interface AppExceptionPayload {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
}
export declare class AppException extends HttpException {
    readonly code: string;
    readonly details?: unknown;
    constructor(payload: AppExceptionPayload);
}
