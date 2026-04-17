import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Fixture {
  name: string;
  category: 'valid' | 'parse-error' | 'simulation-error';
  description: string;
  code: string;
  expectedErrors?: string[];
  expectedError?: string;
}

const staticPath = resolve(__dirname, '../fixtures/static.json');
const generatedPath = resolve(__dirname, '../fixtures/generated.json');

const statics: Fixture[] = JSON.parse(readFileSync(staticPath, 'utf-8'));
const generated: Fixture[] = existsSync(generatedPath)
  ? JSON.parse(readFileSync(generatedPath, 'utf-8'))
  : [];

const all = [...statics, ...generated];

const byCategory = {
  valid: all.filter((f) => f.category === 'valid').length,
  'parse-error': all.filter((f) => f.category === 'parse-error').length,
  'simulation-error': all.filter((f) => f.category === 'simulation-error')
    .length,
};

console.log(`Total fixtures: ${all.length}`);
console.log(`  valid: ${byCategory.valid}`);
console.log(`  parse-error: ${byCategory['parse-error']}`);
console.log(`  simulation-error: ${byCategory['simulation-error']}`);

// Check for duplicate names
const names = new Set<string>();
for (const f of all) {
  if (names.has(f.name)) {
    console.error(`ERROR: Duplicate fixture name "${f.name}"`);
    process.exit(1);
  }
  names.add(f.name);
}

console.log('No duplicate names found.');
