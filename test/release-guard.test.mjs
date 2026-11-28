import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { requireApprovedTerms, validateProductionDescriptor } from '../scripts/validate-production-release.mjs';

const identity = { scope: 'aux4', name: 'cloud-files', type: 'cloud', repository: 'public', private: false, dependencies: ['system:aux4/platform@1.3.153'] };
const metered = JSON.parse(readFileSync(new URL('../package/plans.json', import.meta.url), 'utf8'));

test('accepts the Hub production identity and metered shape', () => assert.equal(validateProductionDescriptor(identity, metered), true));
test('rejects fixed monthly pricing', () => assert.throws(() => validateProductionDescriptor(identity, { schemaVersion: 1, plans: { small: { price: { monthly: 1 } } } }), /fixed monthly pricing/));
test('rejects an unset production rate', () => assert.throws(() => validateProductionDescriptor(identity, { schemaVersion: 1, plans: { small: { price: {} } } }), /approved metered descriptor/));
test('rejects non-public or non-cloud identity', () => assert.throws(() => validateProductionDescriptor({ ...identity, private: true }, metered), /public cloud/));

test("public Files requires the system Platform host", async () => {
  const { readFile } = await import("node:fs/promises");
  const manifest = JSON.parse(await readFile(new URL("../package/.aux4", import.meta.url), "utf8"));
  assert.equal(manifest.repository, "public");
  assert.deepEqual(manifest.dependencies.filter(ref => /(?:^|:)aux4\/platform(?:@|$)/.test(ref)), ["system:aux4/platform@1.3.153"]);
});

test('rejects public, ranged and duplicate Platform host dependencies', () => {
  for (const dependencies of [[], ['aux4/platform@1.3.153'], ['system:aux4/platform@>=1.3.153'],
    ['system:aux4/platform@1.3.153', 'public:aux4/platform@1.3.153']]) {
    assert.throws(() => validateProductionDescriptor({ ...identity, dependencies }, metered), /Cloud builder host/);
  }
});

test('candidate price cannot change rate or allowance silently', () => {
  for (const key of ['microCentsPerUnit', 'includedBytes']) {
    const candidate = structuredClone(metered);
    candidate.plans.usage.price.metered[key]++;
    assert.throws(() => validateProductionDescriptor(identity, candidate), /scope usage plan/);
  }
});

test('draft download policy blocks production publication', () => {
  const draft = readFileSync(new URL('../package/terms.md', import.meta.url));
  assert.throws(() => requireApprovedTerms(draft), /reviewed download terms/);
});
