import { SetMetadata } from '@nestjs/common';

export const PUBLIC_API_KEY = 'public_api';
/**
 * Decorator to mark an endpoint as Public API.
 * This will trigger the TransformInterceptor to wrap the response in { success: true, data: T }.
 * Without this decorator, the response remains raw.
 */
export const PublicApi = () => SetMetadata(PUBLIC_API_KEY, true);
