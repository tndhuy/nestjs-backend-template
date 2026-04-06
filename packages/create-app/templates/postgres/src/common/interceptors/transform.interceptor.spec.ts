import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { RAW_RESPONSE_KEY, TransformInterceptor } from './transform.interceptor';

function createMockContext(isRaw: boolean) {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(isRaw);
  const context = {
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as any;
  return { reflector, context };
}

describe('TransformInterceptor', () => {
  it('should wrap controller return value in { success: true, data }', (done) => {
    const { reflector, context } = createMockContext(false);
    const interceptor = new TransformInterceptor(reflector);
    const next = { handle: () => of({ id: '1', name: 'test' }) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: { id: '1', name: 'test' } });
      done();
    });
  });

  it('should NOT wrap when @RawResponse() is used', (done) => {
    const { reflector, context } = createMockContext(true);
    const interceptor = new TransformInterceptor(reflector);
    const next = { handle: () => of({ status: 'ok' }) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ status: 'ok' });
      done();
    });
  });

  it('should wrap null return value in { success: true, data: null }', (done) => {
    const { reflector, context } = createMockContext(false);
    const interceptor = new TransformInterceptor(reflector);
    const next = { handle: () => of(null) };

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('should use RAW_RESPONSE_KEY constant', () => {
    expect(RAW_RESPONSE_KEY).toBe('raw_response');
  });
});
