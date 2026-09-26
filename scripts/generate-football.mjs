import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { readReference, runJobs, selectJobs } from './generate-pokemon.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { values } = parseArgs({ options: {
  'dry-run': { type: 'boolean', default: false },
  only: { type: 'string' },
} });

try {
  const manifest = JSON.parse(await readFile(join(root, 'docs/football-art-prompts.json'), 'utf8'));
  const jobs = selectJobs(manifest.jobs.map(job => ({ ...job, prompt: job.googlePrompt ?? job.prompt })), values.only);
  if (!values['dry-run'] && existsSync(join(root, '.env.local'))) process.loadEnvFile(join(root, '.env.local'));
  await runJobs({
    jobs,
    outputDir: join(root, 'output/nano-banana-2/football/originals'),
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    reference: await readReference(join(root, 'public/art/rewards/football/russo.webp')),
    dryRun: values['dry-run'],
  });
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
