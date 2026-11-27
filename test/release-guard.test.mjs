import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProductionDescriptor } from '../scripts/validate-production-release.mjs';

const identity = { scope: 'aux4', name: 'cloud-files', type: 'cloud', repository: 'public', private: false };
const metered = { schemaVersion: 1, plans: { small: { price: { metered: { unit: 'gb-month', microCentsPerUnit: 125000, includedBytes: 0 } } } } };

test('accepts the Hub production identity and metered shape', () => assert.equal(validateProductionDescriptor(identity, metered), true));
test('rejects fixed monthly pricing', () => assert.throws(() => validateProductionDescriptor(identity, { schemaVersion: 1, plans: { small: { price: { monthly: 1 } } } }), /fixed monthly pricing/));
test('rejects an unset production rate', () => assert.throws(() => validateProductionDescriptor(identity, { schemaVersion: 1, plans: { small: { price: {} } } }), /approved metered descriptor/));
test('rejects non-public or non-cloud identity', () => assert.throws(() => validateProductionDescriptor({ ...identity, private: true }, metered), /public cloud/));
