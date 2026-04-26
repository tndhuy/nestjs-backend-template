"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toPascalCase = toPascalCase;
exports.buildReplacements = buildReplacements;
exports.validateServiceName = validateServiceName;
function toPascalCase(kebab) {
    return kebab
        .split('-')
        .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
        .join('');
}
function buildReplacements(serviceName) {
    return [
        ['nestjs-backend-template', serviceName],
        ['NestjsBackendTemplate', toPascalCase(serviceName)],
    ];
}
function validateServiceName(name) {
    if (!name || name.length < 2) {
        return 'Service name must be at least 2 characters';
    }
    if (/[A-Z]/.test(name)) {
        return 'Service name must be lowercase (no uppercase letters)';
    }
    if (name.includes(' ')) {
        return 'Service name must not contain spaces';
    }
    if (name.includes('..') || name.includes('/') || name.includes('\\')) {
        return 'Service name must not contain path traversal characters (..  / or \\)';
    }
    if (name.startsWith('-') || name.endsWith('-')) {
        return 'Service name must not start or end with a hyphen';
    }
    if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
        return 'Service name must contain only lowercase letters, numbers, and hyphens';
    }
    return undefined;
}
//# sourceMappingURL=replacements.js.map