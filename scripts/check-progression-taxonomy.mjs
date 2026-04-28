import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const seedSource = readFileSync(path.join(rootDir, 'src', 'progression', 'exerciseLibrarySeed.ts'), 'utf8');
const mappingSource = readFileSync(path.join(rootDir, 'src', 'progression', 'muscleMapping.ts'), 'utf8');
const settingsSource = readFileSync(path.join(rootDir, 'src', 'progression', 'settings.ts'), 'utf8');

const seedEntries = Array.from(
  seedSource.matchAll(/\{\s*name:\s*"([^"]+)"\s*,\s*primaryMuscles:\s*\[([^\]]*)\]/g)
).map((match) => ({
  name: match[1].toLowerCase().trim(),
  primaryMuscles: Array.from(match[2].matchAll(/"([^"]+)"/g)).map((item) => item[1]),
}));

const mappingEntries = new Map(
  Array.from(mappingSource.matchAll(/'([^']+)':\s*\{\s*primary:\s*'([^']+)'/g)).map((match) => [
    match[1].toLowerCase().trim(),
    match[2],
  ])
);

const landmarkKeys = new Set(
  Array.from(settingsSource.matchAll(/^\s*(?:'([^']+)'|([a-z]+))\s*:\s*\{\s*mev:/gm)).map((match) => match[1] || match[2])
);

const missingLandmarks = new Set();
const missingMappings = [];
const mismatchedMappings = [];

for (const entry of seedEntries) {
  entry.primaryMuscles.forEach((muscle) => {
    if (!landmarkKeys.has(muscle)) {
      missingLandmarks.add(muscle);
    }
  });

  const mappedPrimary = mappingEntries.get(entry.name);
  if (!mappedPrimary) {
    missingMappings.push(entry.name);
    continue;
  }

  if (!entry.primaryMuscles.includes(mappedPrimary)) {
    mismatchedMappings.push(`${entry.name} -> seed:${entry.primaryMuscles.join('/')} mapping:${mappedPrimary}`);
  }
}

if (missingLandmarks.size === 0 && missingMappings.length === 0 && mismatchedMappings.length === 0) {
  // eslint-disable-next-line no-console -- Build script output
  console.log('Progression taxonomy check passed.');
  process.exit(0);
}

if (missingLandmarks.size > 0) {
  console.error(`Missing muscle landmarks: ${Array.from(missingLandmarks).sort().join(', ')}`);
}

if (missingMappings.length > 0) {
  console.error(`Missing fallback mappings: ${missingMappings.sort().join(', ')}`);
}

if (mismatchedMappings.length > 0) {
  console.error(`Mismatched fallback mappings: ${mismatchedMappings.sort().join('; ')}`);
}

process.exit(1);
