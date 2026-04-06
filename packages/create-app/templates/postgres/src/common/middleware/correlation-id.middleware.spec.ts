import { CORRELATION_ID_HEADER, CorrelationIdMiddleware } from './correlation-id.middleware';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createMockReq(headers: Record<string, string> = {}): any {
  return { headers: { ...headers } };
}

function createMockRes(): any {
  const headers: Record<string, string> = {};
  return {
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
    _headers: headers,
  };
}

describe('CorrelationIdMiddleware', () => {
  let middleware: CorrelationIdMiddleware;

  beforeEach(() => {
    middleware = new CorrelationIdMiddleware();
  });

  it('should generate UUID v4 when X-Correlation-ID header is absent', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    const correlationId = req.headers[CORRELATION_ID_HEADER.toLowerCase()];
    expect(correlationId).toMatch(UUID_PATTERN);
    expect(next).toHaveBeenCalled();
  });

  it('should preserve existing X-Correlation-ID header', () => {
    const req = createMockReq({ 'x-correlation-id': 'abc-123' });
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.headers['x-correlation-id']).toBe('abc-123');
    expect(res._headers[CORRELATION_ID_HEADER]).toBe('abc-123');
  });

  it('should always set X-Correlation-ID on the response header', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(res._headers[CORRELATION_ID_HEADER]).toBeDefined();
    expect(res._headers[CORRELATION_ID_HEADER]).toMatch(UUID_PATTERN);
  });

  it('should call next()', () => {
    const req = createMockReq();
    const res = createMockRes();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
