// Exercise the mobile dependency ladder's section split and connector styling
// across the FULL DepType union, without a server or database.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(name) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: id => (id === './schema' ? load('schema') : require(id)) });
  return exports;
}
const { DEP_TYPES } = load('schema');
const { dependencyLadder } = load('dep-ladder');
// vm-realm objects have a foreign prototype, so normalize before deep comparison.
const plain = v => JSON.parse(JSON.stringify(v));

const bead = (id, deps = [], extra = {}) => ({ id, title: id, status: 'open', priority: 2, dependencies: deps, ...extra });
const dep = (depends_on_id, type) => ({ depends_on_id, type });

// --- sections: outgoing above, incoming below, parent-child in neither ---
const focus = bead('self', [dep('up-open', 'blocks'), dep('up-done', 'blocks'), dep('epic', 'parent-child')]);
const world = [
  focus,
  bead('up-open'),
  bead('up-done', [], { status: 'closed' }),
  bead('epic', [], { issue_type: 'epic' }),
  bead('down-a', [dep('self', 'blocks')]),
  bead('down-b', [dep('self', 'related')]),
  bead('unrelated', [dep('down-a', 'blocks')]),
];
const { upstream, downstream } = dependencyLadder(focus, world);
assert.deepEqual(plain(upstream.map(r => r.id)), ['up-open', 'up-done'], 'outgoing deps go above; live edges first; parent-child excluded');
assert.deepEqual(plain(downstream.map(r => r.id)), ['down-a', 'down-b'], 'incoming deps go below, no unrelated edges');

// --- connector styling and labels ---
const byId = rows => Object.fromEntries(rows.map(r => [r.id, plain(r.edge)]));
const up = byId(upstream), down = byId(downstream);
assert.deepEqual(up['up-open'], { type: 'blocks', label: 'blocks', blocking: true, resolved: false }, 'live blocker: solid, red, unresolved');
assert.deepEqual(up['up-done'], { type: 'blocks', label: 'blocks · closed', blocking: true, resolved: true }, 'closed blocker resolves the edge');
assert.equal(down['down-a'].blocking, true, 'downstream blocks edge stays solid');
assert.equal(down['down-a'].resolved, false, 'the focused bead is the upper side downstream and is still open');
assert.deepEqual(down['down-b'], { type: 'related', label: 'related', blocking: false, resolved: false }, 'related renders dashed gray with its own label');

// A closed focused bead resolves every downstream edge, not the upstream ones.
const closedFocus = { ...focus, status: 'closed' };
const shut = dependencyLadder(closedFocus, [closedFocus, ...world.slice(1)]);
const shutDown = byId(shut.downstream), shutUp = byId(shut.upstream);
assert.equal(shutDown['down-a'].resolved, true, 'closing the focus resolves its blocking downstream edges');
assert.equal(shutDown['down-b'].resolved, false, 'a non-blocking downstream edge never reads as resolved');
assert.equal(shutUp['up-open'].resolved, false, 'upstream resolution still follows the upstream bead, not the focus');
assert.equal(shutUp['up-done'].resolved, true, 'a closed upstream bead stays resolved');
assert.deepEqual(plain(shut.downstream.map(r => r.id)), ['down-b', 'down-a'], 'live edges sort ahead of resolved ones');

// --- every DepType gets a home, a label, and a defined style ---
const everyType = bead('all', DEP_TYPES.map(t => dep(`t-${t}`, t)));
const all = dependencyLadder(everyType, [everyType, ...DEP_TYPES.map(t => bead(`t-${t}`))]);
assert.equal(all.upstream.length, DEP_TYPES.length - 1, 'every DepType but parent-child lands on the ladder');
const BLOCKING = new Set(['blocks', 'conditional-blocks', 'waits-for']);
for (const rung of all.upstream) {
  assert.ok(rung.edge.label.length > 0, `${rung.edge.type} has a label`);
  assert.equal(rung.edge.blocking, BLOCKING.has(rung.edge.type), `${rung.edge.type} blocking styling matches beads semantics`);
}
assert.ok(all.upstream.every(r => r.bead), 'rungs resolve their target bead when it is in the project');
assert.equal(dependencyLadder(bead('ghost', [dep('missing', 'blocks')]), [])
  .upstream[0].bead, undefined, 'a dangling dependency still renders as a rung');

console.log('PASS: ladder sections, parent-child exclusion, blocking vs dashed connectors, resolution direction, and full DepType coverage');
