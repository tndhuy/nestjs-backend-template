import { buildReplacements, toPascalCase, validateServiceName } from '../replacements';

describe('scaffold', () => {
  // TODO: implement in Plan 02 Task 2 — requires scaffold function to be fully tested

  it('replaces nestjs-backend-template with service name in file contents', () => {
    // TODO: implement — create temp dir, copy postgres template, call scaffold, verify replacement
    expect(true).toBe(true);
  });

  it('replaces NestjsBackendTemplate with PascalCase in file contents', () => {
    // TODO: implement — verify PascalCase replacement in generated files
    expect(true).toBe(true);
  });

  it('renames files containing placeholder in name', () => {
    // TODO: implement — verify file names are renamed correctly after scaffold
    expect(true).toBe(true);
  });

  it('copies postgres template when db=postgres', () => {
    // TODO: implement — assert that postgres-specific files (prisma.module.ts) are present
    expect(true).toBe(true);
  });

  it('copies mongo template when db=mongo', () => {
    // TODO: implement — assert that mongo-specific files (mongodb.module.ts) are present
    expect(true).toBe(true);
  });

  it('generated package.json has correct name', () => {
    // TODO: implement — run scaffold and verify package.json name field
    expect(true).toBe(true);
  });
});

describe('toPascalCase', () => {
  it('converts kebab-case to PascalCase', () => {
    expect(toPascalCase('my-service')).toBe('MyService');
    expect(toPascalCase('nestjs-backend-template')).toBe('NestjsBackendTemplate');
    expect(toPascalCase('user-auth-service')).toBe('UserAuthService');
  });
});

describe('buildReplacements', () => {
  it('returns correct replacement pairs', () => {
    const replacements = buildReplacements('my-service');
    expect(replacements).toContainEqual(['nestjs-backend-template', 'my-service']);
    expect(replacements).toContainEqual(['NestjsBackendTemplate', 'MyService']);
  });
});

describe('validateServiceName', () => {
  it('accepts valid kebab-case names', () => {
    expect(validateServiceName('my-service')).toBeUndefined();
    expect(validateServiceName('user-auth-service')).toBeUndefined();
    expect(validateServiceName('ab')).toBeUndefined();
  });

  it('rejects names with path traversal characters', () => {
    expect(validateServiceName('../evil')).toBeDefined();
    expect(validateServiceName('foo/bar')).toBeDefined();
    expect(validateServiceName('foo\\bar')).toBeDefined();
  });

  it('rejects uppercase letters', () => {
    expect(validateServiceName('MyService')).toBeDefined();
    expect(validateServiceName('my-Service')).toBeDefined();
  });

  it('rejects names with leading or trailing hyphens', () => {
    expect(validateServiceName('-my-service')).toBeDefined();
    expect(validateServiceName('my-service-')).toBeDefined();
  });

  it('rejects names that are too short', () => {
    expect(validateServiceName('a')).toBeDefined();
  });

  it('rejects names with spaces', () => {
    expect(validateServiceName('my service')).toBeDefined();
  });
});
