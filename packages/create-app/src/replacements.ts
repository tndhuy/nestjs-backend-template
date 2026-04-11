/**
 * Placeholder substitution definitions for the scaffold engine.
 *
 * Placeholders used throughout the template:
 *   - nestjs-backend-template  → service name in kebab-case
 *   - NestjsBackendTemplate    → service name in PascalCase
 */

export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

export function buildReplacements(serviceName: string): [string, string][] {
  return [
    ['nestjs-backend-template', serviceName],
    ['{{SERVICE_NAME_KEBAB}}', serviceName],
    ['NestjsBackendTemplate', toPascalCase(serviceName)],
  ];
}

/**
 * Validate a service name for use as a directory name and package name.
 *
 * Rules (per T-05-01 threat model):
 *   - Only lowercase alphanumerics and hyphens: [a-z0-9-]
 *   - Must be at least 2 characters
 *   - No leading or trailing hyphens
 *   - No path traversal characters: .., /, \
 *   - No uppercase letters
 *   - No spaces
 *
 * Returns undefined if valid, or an error string if invalid.
 */
export function validateServiceName(name: string): string | undefined {
  if (!name || name.length < 2) {
    return 'Service name must be at least 2 characters';
  }

  if (/[A-Z]/.test(name)) {
    return 'Service name must be lowercase (no uppercase letters)';
  }

  if (name.includes(' ')) {
    return 'Service name must not contain spaces';
  }

  // Reject path traversal characters
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Service name must not contain path traversal characters (..  / or \\)';
  }

  // Reject leading or trailing hyphens
  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Service name must not start or end with a hyphen';
  }

  // Only allow lowercase alphanumerics and hyphens
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
    return 'Service name must contain only lowercase letters, numbers, and hyphens';
  }

  return undefined;
}
