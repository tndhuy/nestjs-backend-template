import { HttpException } from '@nestjs/common';

export interface AppExceptionPayload {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class AppException extends HttpException {
  public readonly code: string;
  public readonly details?: unknown;

  constructor(payload: AppExceptionPayload) {
    super(payload, payload.statusCode);
    this.code = payload.code;
    this.details = payload.details;
  }
}
