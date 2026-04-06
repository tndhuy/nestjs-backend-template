import { SetMetadata } from '@nestjs/common';
import { RAW_RESPONSE_KEY } from '../interceptors/transform.interceptor';

export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
