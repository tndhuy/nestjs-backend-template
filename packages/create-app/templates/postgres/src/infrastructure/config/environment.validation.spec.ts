import 'reflect-metadata';
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EnvironmentVariables } from './environment.validation';

function buildConfig(overrides: Record<string, unknown> = {}): EnvironmentVariables {
  return plainToInstance(
    EnvironmentVariables,
    {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      REDIS_URL: 'redis://localhost:6379',
      ...overrides,
    },
    { enableImplicitConversion: true },
  );
}

describe('EnvironmentVariables', () => {
  describe('valid configuration', () => {
    it('should pass validation with all required fields provided', () => {
      const config = buildConfig();
      const errors = validateSync(config, { skipMissingProperties: false });
      expect(errors).toHaveLength(0);
    });

    it('should use default PORT of 3000 when PORT is not provided', () => {
      const config = buildConfig();
      expect(config.PORT).toBe(3000);
    });

    it('should use default NODE_ENV of development when NODE_ENV is not provided', () => {
      const config = buildConfig();
      expect(config.NODE_ENV).toBe('development');
    });

    it('should accept PORT within valid range (1–65535)', () => {
      const config = buildConfig({ PORT: '8080' });
      const errors = validateSync(config, { skipMissingProperties: false });
      expect(errors).toHaveLength(0);
      expect(config.PORT).toBe(8080);
    });

    it('should accept all valid NODE_ENV values', () => {
      for (const env of ['development', 'production', 'test']) {
        const config = buildConfig({ NODE_ENV: env });
        const errors = validateSync(config, { skipMissingProperties: false });
        expect(errors).toHaveLength(0);
      }
    });
  });

  describe('missing required fields', () => {
    it('should fail validation when DATABASE_URL is missing', () => {
      const config = plainToInstance(
        EnvironmentVariables,
        { REDIS_URL: 'redis://localhost:6379' },
        { enableImplicitConversion: true },
      );
      const errors = validateSync(config, { skipMissingProperties: false });
      const fieldNames = errors.map((e) => e.property);
      expect(fieldNames).toContain('DATABASE_URL');
    });

    it('should fail validation when REDIS_URL is missing', () => {
      const config = plainToInstance(
        EnvironmentVariables,
        { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' },
        { enableImplicitConversion: true },
      );
      const errors = validateSync(config, { skipMissingProperties: false });
      const fieldNames = errors.map((e) => e.property);
      expect(fieldNames).toContain('REDIS_URL');
    });
  });

  describe('PORT validation', () => {
    it('should fail validation when PORT is below 1', () => {
      const config = buildConfig({ PORT: '0' });
      const errors = validateSync(config, { skipMissingProperties: false });
      const portErrors = errors.filter((e) => e.property === 'PORT');
      expect(portErrors.length).toBeGreaterThan(0);
    });

    it('should fail validation when PORT exceeds 65535', () => {
      const config = buildConfig({ PORT: '65536' });
      const errors = validateSync(config, { skipMissingProperties: false });
      const portErrors = errors.filter((e) => e.property === 'PORT');
      expect(portErrors.length).toBeGreaterThan(0);
    });
  });

  describe('NODE_ENV whitelist', () => {
    it('should fail validation when NODE_ENV is not in the allowed list', () => {
      const config = buildConfig({ NODE_ENV: 'staging' });
      const errors = validateSync(config, { skipMissingProperties: false });
      const nodeEnvErrors = errors.filter((e) => e.property === 'NODE_ENV');
      expect(nodeEnvErrors.length).toBeGreaterThan(0);
    });
  });
});
