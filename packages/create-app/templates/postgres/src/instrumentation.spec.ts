describe('instrumentation.ts feature flag', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should export null when OTEL_ENABLED is not set', async () => {
    delete process.env.OTEL_ENABLED;
    const mod = await import('./instrumentation');
    expect(mod.default).toBeNull();
  });

  it('should export null when OTEL_ENABLED is "false"', async () => {
    process.env.OTEL_ENABLED = 'false';
    const mod = await import('./instrumentation');
    expect(mod.default).toBeNull();
  });
});
