"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsup_1 = require("tsup");
exports.default = (0, tsup_1.defineConfig)({
    entry: ['src/cli.ts'],
    format: ['cjs'],
    clean: true,
    outDir: 'dist',
});
//# sourceMappingURL=tsup.config.js.map