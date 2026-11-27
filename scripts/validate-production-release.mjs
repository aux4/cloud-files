import { readFile } from 'node:fs/promises';

export function validateProductionDescriptor(metadata, plans) {
  if (!metadata || metadata.scope !== 'aux4' || metadata.name !== 'cloud-files') {
    throw new Error('package identity must be aux4/cloud-files');
  }
  if (metadata.type !== 'cloud' || metadata.repository !== 'public' || metadata.private !== false) {
    throw new Error('package must be a public cloud package');
  }
  const hosts = (metadata.dependencies || []).filter(ref => /(?:^|:)aux4\/platform(?:@|$)/.test(ref));
  if (hosts.length !== 1 || hosts[0] !== 'system:aux4/platform@1.3.153') {
    throw new Error('Files requires the Cloud builder host system:aux4/platform@1.3.153');
  }
  if (!plans || plans.schemaVersion !== 1 || !plans.plans || typeof plans.plans !== 'object') {
    throw new Error('plans.json must contain schemaVersion 1 and plans');
  }
  const entries = Object.entries(plans.plans);
  if (entries.length === 0) throw new Error('at least one production plan is required');
  for (const [name, plan] of entries) {
    const price = plan?.price;
    if (!price || typeof price !== 'object' || Array.isArray(price)) {
      throw new Error(`plan ${name} must have a price descriptor`);
    }
    if (Object.hasOwn(price, 'monthly')) {
      throw new Error(`plan ${name} uses fixed monthly pricing; production Cloud Files requires GB-month metering`);
    }
    const meter = price.metered;
    if (!meter || typeof meter !== 'object' || Array.isArray(meter)) {
      throw new Error(`plan ${name} must have an approved metered descriptor; production rate is not set`);
    }
    if (Object.keys(meter).sort().join(',') !== 'includedBytes,microCentsPerUnit,unit') {
      throw new Error(`plan ${name} metered descriptor has unsupported fields`);
    }
    if (meter.unit !== 'gb-month') throw new Error(`plan ${name} metering unit must be gb-month`);
    if (!Number.isSafeInteger(meter.microCentsPerUnit) || meter.microCentsPerUnit <= 0) {
      throw new Error(`plan ${name} must set a positive integer microCentsPerUnit`);
    }
    if (!Number.isSafeInteger(meter.includedBytes) || meter.includedBytes < 0) {
      throw new Error(`plan ${name} must set a non-negative integer includedBytes`);
    }
  }
  return true;
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  const metadata = JSON.parse(await readFile('package/.aux4', 'utf8'));
  const plans = JSON.parse(await readFile('package/plans.json', 'utf8'));
  validateProductionDescriptor(metadata, plans);
  console.log('production release descriptor is valid');
}
