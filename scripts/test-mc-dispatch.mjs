import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mcBaseUrl, readMcToken, readMcProject, omgBuildCommand, mcFetch, McError } from '../lib/mc-dispatch.ts';

const dir = mkdtempSync(join(tmpdir(), 'scotty-mc-'));
const seen = [];
const server = http.createServer((req, res) => {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    seen.push({ method: req.method, url: req.url, auth: req.headers.authorization, ct: req.headers['content-type'], body: raw });
    res.setHeader('content-type', 'application/json');
    if (req.url === '/conflict') { res.statusCode = 409; res.end(JSON.stringify({ error: 'run already live' })); return; }
    res.end(JSON.stringify({ echo: raw ? JSON.parse(raw) : null }));
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

try {
  // omgBuildCommand
  assert.equal(omgBuildCommand({ id: 'e-1', issue_type: 'epic' }, false), '/omg-build e-1');
  assert.equal(omgBuildCommand({ id: 'e-1', issue_type: 'epic', parent: 'x' }, true), '/omg-build e-1');
  assert.equal(omgBuildCommand({ id: 'e-1.2', issue_type: 'task', parent: 'e-1' }, true), '/omg-build e-1 e-1.2');
  assert.equal(omgBuildCommand({ id: 'o-1', issue_type: 'task', parent: 'p-1' }, false), '/omg-build o-1');
  assert.equal(omgBuildCommand({ id: 'o-2', issue_type: 'bug', parent: null }, false), '/omg-build o-2');

  // mcBaseUrl
  assert.equal(mcBaseUrl({}), 'http://127.0.0.1:3000');
  assert.equal(mcBaseUrl({ MC_BASE_URL: 'http://x:1' }), 'http://x:1');

  // readMcToken: env beats file; file trimmed; null when absent
  const tokFile = join(dir, 'tok');
  writeFileSync(tokFile, 'mcs_file\n');
  assert.equal(readMcToken({ MC_SERVICE_TOKEN: 'mcs_env', MC_SERVICE_TOKEN_FILE: tokFile }), 'mcs_env');
  assert.equal(readMcToken({ MC_SERVICE_TOKEN_FILE: tokFile }), 'mcs_file');
  assert.equal(readMcToken({ MC_SERVICE_TOKEN_FILE: join(dir, 'nope') }), null);

  // readMcProject
  mkdirSync(join(dir, 'repo', '.beads'), { recursive: true });
  writeFileSync(join(dir, 'repo', '.beads', 'metadata.json'), JSON.stringify({ dolt_database: 'bead_me_up_scotty' }));
  assert.equal(readMcProject(join(dir, 'repo')), 'bead_me_up_scotty');
  assert.equal(readMcProject(join(dir, 'missing')), null);

  // mcFetch
  const env = { MC_BASE_URL: base, MC_SERVICE_TOKEN: 'mcs_secret' };
  assert.deepEqual(await mcFetch('/x?a=1', {}, { env }), { echo: null });
  assert.deepEqual(seen[0], { method: 'GET', url: '/x?a=1', auth: 'Bearer mcs_secret', ct: 'application/json', body: '' });
  assert.deepEqual(await mcFetch('/y', { method: 'POST', body: { project: 'db' } }, { env }), { echo: { project: 'db' } });
  assert.equal(seen[1].method, 'POST');
  assert.equal(seen[1].body, '{"project":"db"}');

  const conflict = await mcFetch('/conflict', { method: 'POST', body: {} }, { env }).catch((e) => e);
  assert.ok(conflict instanceof McError);
  assert.equal(conflict.status, 409);
  assert.equal(conflict.message, 'run already live');
  assert.equal(conflict.code, 'mc_error');

  const noTok = await mcFetch('/x', {}, { env: { MC_BASE_URL: base, MC_SERVICE_TOKEN_FILE: join(dir, 'nope') } }).catch((e) => e);
  assert.ok(noTok instanceof McError);
  assert.equal(noTok.status, 503);
  assert.equal(noTok.code, 'mc_not_configured');
  assert.equal(seen.length, 3, 'no token must not reach the network');

  const closed = http.createServer();
  await new Promise((r) => closed.listen(0, '127.0.0.1', r));
  const deadPort = closed.address().port;
  await new Promise((r) => closed.close(r));
  const dead = await mcFetch('/x', {}, { env: { MC_BASE_URL: `http://127.0.0.1:${deadPort}`, MC_SERVICE_TOKEN: 't' } }).catch((e) => e);
  assert.ok(dead instanceof McError);
  assert.equal(dead.status, 502);
  assert.equal(dead.code, 'mc_unreachable');

  console.log('mc-dispatch: ok');
} finally {
  server.close();
  rmSync(dir, { recursive: true, force: true });
}
