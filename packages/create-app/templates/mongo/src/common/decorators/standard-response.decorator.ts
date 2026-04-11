import { SetMetadata } from '@nestjs/common';

export const STANDARD_RESPONSE_KEY = 'standard_response';

/**
 * Decorator to wrap the response in a standardized envelope:
 * { success: true, data: T, meta?: PaginationMeta }
 */
export const StandardResponse = () => SetMetadata(STANDARD_RESPONSE_KEY, true);
