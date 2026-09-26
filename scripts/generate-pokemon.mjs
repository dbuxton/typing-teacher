import { existsSync } from 'node:fs';
import { mkdir, open, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const MODEL = 'gemini-3.1-flash-image';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const EXTENSIONS = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

export function selectJobs(jobs, only) {
  if (!Array.isArray(jobs) || jobs.length === 0) throw new Error('The prompt list is empty.');
  const ids = new Set();
  for (const job of jobs) {
    if (typeof job.id !== 'string' || !/^[a-z0-9-]+$/.test(job.id) || typeof job.prompt !== 'string' || !job.prompt.trim()) {
      throw new Error('The prompt list contains an invalid id or empty prompt.');
    }
    if (ids.has(job.id)) throw new Error(`Duplicate character: ${job.id}`);
    ids.add(job.id);
  }
  if (only === undefined) return jobs;
  const requested = new Set(only.split(',').map(id => id.trim()).filter(Boolean));
  if (!requested.size) throw new Error('--only needs at least one character id.');
  for (const id of requested) {
    if (!ids.has(id)) throw new Error(`Unknown character: ${id}`);
  }
  return jobs.filter(job => requested.has(job.id));
}

export async function readReference(path) {
  if (!path) return undefined;
  const mimeType = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' }[extname(path).toLowerCase()];
  if (!mimeType) throw new Error('The reference must be a PNG, JPEG or WebP image.');
  const bytes = await readFile(path);
  if (!bytes.length || bytes.length > 10 * 1024 * 1024) {
    throw new Error('Use a reference image smaller than 10 MB.');
  }
  return { mimeType, data: bytes.toString('base64') };
}

export async function generateImage({ prompt, apiKey, reference, fetchImpl = fetch }) {
  const parts = [{ text: prompt }];
  if (reference) parts.push({ inlineData: reference });
  let response;
  try {
    response = await fetchImpl(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: { aspectRatio: '1:1', imageSize: '1K' },
        },
      }),
      signal: AbortSignal.timeout(180_000),
      redirect: 'error',
    });
  } catch {
    // Do not log fetch errors: request objects can contain authentication headers.
    throw new Error('The Google request failed or timed out. No automatic retry was made; it may already have been processed.');
  }
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      if (typeof body.error?.message === 'string') {
        detail = body.error.message.split(apiKey).join('[REDACTED]').replace(/[\r\n\t]/g, ' ').slice(0, 800);
      }
    } catch { /* Some gateway errors have no JSON body. */ }
    const hint = {
      400: 'Check the request settings and that this is a Gemini API key.',
      401: 'Check your Gemini API key.',
      403: 'Check the key permissions and Gemini API access for its project.',
      404: `The project could not access model ${MODEL}.`,
      429: 'Check the project quota and billing, then retry later.',
    }[response.status] || 'Retry later after checking the project in Google AI Studio.';
    throw new Error(`Google returned HTTP ${response.status}. ${hint}${detail ? ` Details: ${detail}` : ''}`);
  }
  let result;
  try { result = await response.json(); }
  catch { throw new Error('Google returned an unreadable response. No automatic retry was made.'); }
  const candidate = result.candidates?.[0];
  const image = candidate?.content?.parts?.find(part => !part.thought && part.inlineData?.data)?.inlineData;
  if (!image) {
    const reason = result.promptFeedback?.blockReason || candidate?.finishReason;
    const suffix = typeof reason === 'string' && /^[A-Z_]+$/.test(reason) ? ` (${reason})` : '';
    throw new Error(`Google returned no final image${suffix}. The run has stopped without changing the prompt.`);
  }
  const extension = EXTENSIONS[image.mimeType];
  if (!extension) throw new Error('Google returned an unsupported image type.');
  const bytes = Buffer.from(image.data, 'base64');
  if (!bytes.length) throw new Error('Google returned an empty image.');
  return { bytes, extension, usage: result.usageMetadata };
}

export async function runJobs({ jobs, outputDir, apiKey, reference, referenceForJob, dryRun = false, fetchImpl = fetch, log = console.log }) {
  const pending = jobs.filter(job => {
    const exists = Object.values(EXTENSIONS).some(ext => existsSync(join(outputDir, `${job.id}${ext}`)));
    if (exists) log(`Skipping ${job.id}: already saved.`);
    return !exists;
  });
  log(`${dryRun ? 'Dry run: ' : ''}${pending.length} individual requests to ${MODEL}.`);
  if (dryRun) {
    for (const job of pending) log(`  ${job.id}`);
    return;
  }
  if (!pending.length) return;
  if (!apiKey?.trim()) throw new Error('Add GEMINI_API_KEY to .env.local, then run this command again.');
  await mkdir(outputDir, { recursive: true });
  const lockPath = join(outputDir, '.generation.lock');
  let lock;
  try { lock = await open(lockPath, 'wx', 0o600); }
  catch (error) {
    if (error.code === 'EEXIST') throw new Error('This output folder is locked by another run. See docs/nano-banana-2.md if a previous run was interrupted.');
    throw error;
  }
  try {
    for (const [index, job] of pending.entries()) {
      if (Object.values(EXTENSIONS).some(ext => existsSync(join(outputDir, `${job.id}${ext}`)))) {
        log(`Skipping ${job.id}: already saved.`);
        continue;
      }
      log(`[${index + 1}/${pending.length}] Generating ${job.id}…`);
      const jobReference = referenceForJob ? await referenceForJob(job) : reference;
      const { bytes, extension, usage } = await generateImage({ prompt: job.prompt, apiKey, reference: jobReference, fetchImpl });
      const path = join(outputDir, `${job.id}${extension}`);
      const temporaryPath = `${path}.partial`;
      try {
        await writeFile(temporaryPath, bytes);
        await rename(temporaryPath, path);
      } finally { await rm(temporaryPath, { force: true }); }
      await writeFile(join(outputDir, `${job.id}.json`), JSON.stringify({
        id: job.id, model: MODEL, prompt: job.prompt,
        aspectRatio: '1:1', imageSize: '1K', usedReference: Boolean(jobReference),
        generatedAt: new Date().toISOString(), usage,
      }, null, 2) + '\n');
      log(`Saved ${path}`);
    }
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

async function main() {
  const { values } = parseArgs({ options: {
    'dry-run': { type: 'boolean', default: false },
    only: { type: 'string' }, reference: { type: 'string' }, out: { type: 'string' },
    help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) {
    console.log(`Generate the saved Pokémon prompts with Nano Banana 2 (Node 22+).

npm run art:pokemon -- [options]
  --dry-run           List pending images without using the API
  --only magikarp     Generate one character, or a comma-separated list
  --reference PATH    Send this image to Google as a style reference
  --out PATH          Save to another folder (default: output/nano-banana-2/originals)

Put GEMINI_API_KEY in .env.local. Existing images are skipped.
Each pending character makes one billable API request; errors stop the run.`);
    return;
  }
  const { jobs } = JSON.parse(await readFile(join(ROOT, 'docs/pokemon-character-prompts.json'), 'utf8'));
  const selected = selectJobs(jobs, values.only);
  const reference = await readReference(values.reference && resolve(values.reference));
  if (!values['dry-run'] && existsSync(join(ROOT, '.env.local'))) process.loadEnvFile(join(ROOT, '.env.local'));
  await runJobs({
    jobs: selected,
    outputDir: values.out ? resolve(values.out) : join(ROOT, 'output/nano-banana-2/originals'),
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    reference, dryRun: values['dry-run'],
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    // Only our concise errors are printed, never request headers or response bodies.
    console.error(error.message);
    process.exitCode = 1;
  });
}
