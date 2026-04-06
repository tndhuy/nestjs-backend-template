import { PaginationMeta } from './pagination.dto';

export interface ResponseEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}
