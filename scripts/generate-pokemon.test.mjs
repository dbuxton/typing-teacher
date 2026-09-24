import assert from 'node:assert/strict';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { generateImage, MODEL, readReference, runJobs, selectJobs } from './generate-pokemon.mjs';

const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const jobs = [
  { id: 'magikarp', prompt: 'A cheerful Magikarp.' },
  { id: 'bulbasaur', prompt: 'A cheerful Bulbasaur.' },
];
const success = () => Response.json({ candidates: [{ content: { parts: [
  { thought: true, inlineData: { mimeType: 'image/png', data: 'aW50ZXJpbQ==' } },
  { inlineData: { mimeType: 'image/png', data: PNG } },
] } }] });

async function temporaryDirectory(t) {
  const path = await mkdtemp(join(tmpdir(), 'pokemon-generator-'));
  t.after(() => rm(path, { recursive: true, force: true }));
  return path;
}

test('sends one prompt and optional reference to Google, with the key only in the header', async () => {
  const reference = { mimeType: 'image/png', data: PNG };
  const image = await generateImage({
    prompt: jobs[0].prompt, apiKey: 'test-secret', reference,
    fetchImpl: async (url, options) => {
      assert.equal(url, `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`);
      assert.equal(options.headers['x-goog-api-key'], 'test-secret');
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.ok(!options.body.includes('test-secret'));
      const body = JSON.parse(options.body);
      assert.deepEqual(body.contents, [{ role: 'user', parts: [{ text: jobs[0].prompt }, { inlineData: reference }] }]);
      assert.deepEqual(body.generationConfig, {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: { aspectRatio: '1:1', imageSize: '1K' },
      });
      return success();
    },
  });
  assert.deepEqual(image.bytes, Buffer.from(PNG, 'base64'));
  assert.equal(image.extension, '.png');
});

test('reports quota errors without leaking response bodies or retrying', async () => {
  let calls = 0;
  await assert.rejects(generateImage({ prompt: jobs[0].prompt, apiKey: 'test-secret', fetchImpl: async () => {
    calls++;
    return new Response('test-secret', { status: 429 });
  } }), error => /HTTP 429/.test(error.message) && !error.message.includes('test-secret'));
  assert.equal(calls, 1);
  await assert.rejects(generateImage({ prompt: jobs[0].prompt, apiKey: 'test-secret', fetchImpl: async () => {
    return Response.json({ error: { message: 'Rejected key test-secret' } }, { status: 400 });
  } }), error => error.message.includes('Rejected key [REDACTED]') && !error.message.includes('test-secret'));
  await assert.rejects(generateImage({ prompt: jobs[0].prompt, apiKey: 'test-secret', fetchImpl: async () => {
    throw new Error('fetch failed; key=test-secret');
  } }), error => /No automatic retry/.test(error.message) && !error.message.includes('test-secret'));
});

test('does not accept an interim image or silently retry a blocked result', async () => {
  await assert.rejects(generateImage({ prompt: jobs[0].prompt, apiKey: 'test', fetchImpl: async () => Response.json({
    candidates: [{ finishReason: 'IMAGE_SAFETY', content: { parts: [{ thought: true, inlineData: { mimeType: 'image/png', data: PNG } }] } }],
  }) }), /no final image \(IMAGE_SAFETY\)/);
});

test('saves outputs and metadata, then resumes without more requests', async t => {
  const outputDir = await temporaryDirectory(t);
  let calls = 0;
  const options = { jobs, outputDir, apiKey: 'test-secret', log: () => {}, fetchImpl: async () => { calls++; return success(); } };
  await runJobs(options);
  await runJobs(options);
  assert.equal(calls, 2);
  assert.deepEqual(await readFile(join(outputDir, 'magikarp.png')), Buffer.from(PNG, 'base64'));
  const metadata = await readFile(join(outputDir, 'magikarp.json'), 'utf8');
  assert.equal(JSON.parse(metadata).prompt, jobs[0].prompt);
  assert.ok(!metadata.includes('test-secret'));
  assert.ok(!(await readdir(outputDir)).includes('.generation.lock'));
});

test('dry run requires no key and never calls the API or writes files', async t => {
  const outputDir = await temporaryDirectory(t);
  const logs = [];
  await runJobs({ jobs, outputDir, dryRun: true, log: text => logs.push(text), fetchImpl: () => assert.fail('unexpected API request') });
  assert.match(logs[0], /Dry run: 2/);
  assert.deepEqual(await readdir(outputDir), []);
});

test('stops after the first failure and releases the output lock', async t => {
  const outputDir = await temporaryDirectory(t);
  let calls = 0;
  await assert.rejects(runJobs({ jobs, outputDir, apiKey: 'test', log: () => {}, fetchImpl: async () => {
    calls++;
    return new Response('', { status: 403 });
  } }), /HTTP 403/);
  assert.equal(calls, 1);
  assert.deepEqual(await readdir(outputDir), []);
});

test('a concurrent run cannot spend quota in the same output folder', async t => {
  const outputDir = await temporaryDirectory(t);
  await writeFile(join(outputDir, '.generation.lock'), '');
  await assert.rejects(runJobs({ jobs, outputDir, apiKey: 'test', log: () => {}, fetchImpl: () => assert.fail('unexpected API request') }), /locked by another run/);
});

test('validates selections and loads a local style reference', async t => {
  assert.deepEqual(selectJobs(jobs, 'bulbasaur'), [jobs[1]]);
  assert.throws(() => selectJobs(jobs, 'pikachu'), /Unknown character/);
  assert.throws(() => selectJobs([{ id: '../bad', prompt: 'test' }]), /invalid id/);
  const path = join(await temporaryDirectory(t), 'reference.png');
  await writeFile(path, Buffer.from(PNG, 'base64'));
  assert.deepEqual(await readReference(path), { mimeType: 'image/png', data: PNG });
});
