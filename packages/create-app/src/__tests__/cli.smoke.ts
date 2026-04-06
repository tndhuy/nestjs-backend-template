import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

describe('CLI smoke test', () => {
  // TODO: implement in Plan 03 — requires end-to-end CLI invocation in temp directory

  it('scaffolds a project in temp directory', async () => {
    // TODO: implement — spawn CLI process with mocked prompt answers, verify output directory structure
    // Steps:
    // 1. Create temp directory
    // 2. Run CLI with pre-answered prompts (using execa with piped stdin)
    // 3. Verify the generated project:
    //    - Has correct package.json with service name
    //    - Contains src/app.module.ts
    //    - Contains src/modules/example/
    //    - Has no occurrences of 'nestjs-backend-template' string
    // 4. Clean up temp directory
    expect(true).toBe(true);
  });
});
