/**
 * Comprehensive Automated Test Suite for Malaysia Postal & Administrative Lookup
 * ==============================================================================
 * Location: scripts/test-malaysia-lookup.mjs
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

import { pathToFileURL } from 'node:url';

const lookupPath = path.join(ROOT_DIR, 'public', 'data', 'malaysia-postal', 'lookup.ts');
const {
  lookupMalaysiaPostcode,
  validateMalaysiaPostcode,
  getMalaysiaPostalIndex,
  clearMalaysiaPostalCache
} = await import(pathToFileURL(lookupPath).href);

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function it(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function itAsync(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('STARTING MALAYSIA POSTAL LOOKUP TEST SUITE');
  console.log('======================================================\n');

  clearMalaysiaPostalCache();

  // Test Group 1: Format Validation
  console.log('Group 1: Postcode Format Validation & Normalization');
  it('Validates 5-digit canonical postcode "43000"', () => {
    const res = validateMalaysiaPostcode('43000');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '43000');
  });

  it('Validates leading-zero postcode "01000" (Perlis)', () => {
    const res = validateMalaysiaPostcode('01000');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '01000');
  });

  it('Normalizes whitespace: " 43000 " -> "43000"', () => {
    const res = validateMalaysiaPostcode(' 43000 ');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '43000');
  });

  it('Normalizes internal whitespace: "43 000" -> "43000"', () => {
    const res = validateMalaysiaPostcode('43 000');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '43000');
  });

  it('Rejects 4-digit postcode "4300"', () => {
    const res = validateMalaysiaPostcode('4300');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('5 digits'));
  });

  it('Rejects 6-digit postcode "430000"', () => {
    const res = validateMalaysiaPostcode('430000');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('5 digits'));
  });

  it('Rejects alphabetic/alphanumeric strings', () => {
    const res1 = validateMalaysiaPostcode('43A00');
    const res2 = validateMalaysiaPostcode('ABCDE');
    assert.strictEqual(res1.valid, false);
    assert.strictEqual(res2.valid, false);
  });

  // Test Group 2: Index & Metadata Integrity
  console.log('\nGroup 2: Dataset Index & Top-Level Unit Integrity');
  await itAsync('Loads index.json successfully with exactly 16 units', async () => {
    const index = await getMalaysiaPostalIndex();
    assert.ok(index);
    assert.strictEqual(index.country.isoAlpha2, 'MY');
    assert.strictEqual(index.country.isoAlpha3, 'MYS');
    assert.strictEqual(index.country.isoNumeric, '458');
    assert.strictEqual(index.administrativeSummary.stateCount, 13);
    assert.strictEqual(index.administrativeSummary.federalTerritoryCount, 3);
    assert.strictEqual(index.administrativeSummary.totalTopLevelUnits, 16);
    assert.strictEqual(index.topLevelUnits.length, 16);
  });

  // Test Group 3: Core Runtime Lookups
  console.log('\nGroup 3: Offline Lookup & Administrative Resolution');
  await itAsync('Looks up 43000 (Kajang, Selangor, District Hulu Langat)', async () => {
    const res = await lookupMalaysiaPostcode('43000');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '43000');
    assert.ok(res.matches.length >= 1);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Selangor');
    assert.strictEqual(m.administrativeArea.administrativeType, 'State');
    assert.strictEqual(m.district.nameEn, 'Hulu Langat');
    assert.strictEqual(m.district.administrativeType, 'District');
    assert.strictEqual(m.city.nameEn, 'Kajang');
  });

  await itAsync('Looks up 01000 (Kangar, Perlis - Leading Zero preserved)', async () => {
    const res = await lookupMalaysiaPostcode('01000');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '01000');
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Perlis');
    assert.strictEqual(m.administrativeArea.code, 'MY-09');
    assert.strictEqual(m.district.nameEn, 'Perlis');
    assert.strictEqual(m.city.nameEn, 'Kangar');
  });

  await itAsync('Looks up 15000 (Kota Bharu, Kelantan - Preserves Jajahan)', async () => {
    const res = await lookupMalaysiaPostcode('15000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Kelantan');
    assert.strictEqual(m.district.administrativeType, 'Jajahan');
    assert.strictEqual(m.district.nameEn, 'Kota Bharu');
    assert.strictEqual(m.city.nameEn, 'Kota Bharu');
  });

  await itAsync('Looks up 50450 (Kuala Lumpur - Preserves Federal Territory)', async () => {
    const res = await lookupMalaysiaPostcode('50450');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Kuala Lumpur');
    assert.strictEqual(m.administrativeArea.administrativeType, 'Federal Territory');
    assert.strictEqual(m.administrativeArea.code, 'MY-14');
  });

  await itAsync('Looks up 62000 (Putrajaya - Federal Territory)', async () => {
    const res = await lookupMalaysiaPostcode('62000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Putrajaya');
    assert.strictEqual(m.administrativeArea.administrativeType, 'Federal Territory');
    assert.strictEqual(m.administrativeArea.code, 'MY-16');
  });

  await itAsync('Looks up 87000 (Labuan - Federal Territory)', async () => {
    const res = await lookupMalaysiaPostcode('87000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Labuan');
    assert.strictEqual(m.administrativeArea.administrativeType, 'Federal Territory');
    assert.strictEqual(m.administrativeArea.code, 'MY-15');
  });

  await itAsync('Looks up 88000 (Kota Kinabalu, Sabah)', async () => {
    const res = await lookupMalaysiaPostcode('88000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Sabah');
    assert.strictEqual(m.administrativeArea.code, 'MY-12');
    assert.strictEqual(m.city.nameEn, 'Kota Kinabalu');
  });

  await itAsync('Looks up 93000 (Kuching, Sarawak)', async () => {
    const res = await lookupMalaysiaPostcode('93000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.administrativeArea.nameEn, 'Sarawak');
    assert.strictEqual(m.administrativeArea.code, 'MY-13');
    assert.strictEqual(m.city.nameEn, 'Kuching');
  });

  // Test Group 4: Multi-Match Preservation
  console.log('\nGroup 4: Multi-Match Disambiguation Preservation');
  await itAsync('Preserves multiple locality matches for 84300 without overwrite', async () => {
    const res = await lookupMalaysiaPostcode('84300');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.matches.length, 2);
    const cities = res.matches.map(m => m.city.nameEn);
    assert.ok(cities.includes('Bukit Pasir'));
    assert.ok(cities.includes('Muar'));
  });

  await itAsync('Preserves multiple locality matches for 86400 (Batu Pahat & Parit Raja)', async () => {
    const res = await lookupMalaysiaPostcode('86400');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.matches.length, 2);
    const cities = res.matches.map(m => m.city.nameEn);
    assert.ok(cities.includes('Batu Pahat'));
    assert.ok(cities.includes('Parit Raja'));
  });

  // Test Group 5: Edge cases & Performance
  console.log('\nGroup 5: Edge Cases, Cache & Performance');
  await itAsync('Handles unknown postal code "99999" gracefully', async () => {
    const res = await lookupMalaysiaPostcode('99999');
    assert.strictEqual(res.found, false);
    assert.strictEqual(res.matches.length, 0);
  });

  await itAsync('Handles numeric input 43000 gracefully', async () => {
    const res = await lookupMalaysiaPostcode(43000);
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '43000');
  });

  await itAsync('Cache hit executes in sub-millisecond time', async () => {
    // First call primes cache
    await lookupMalaysiaPostcode('43000');
    const start = performance.now();
    const runs = 1000;
    for (let i = 0; i < runs; i++) {
      await lookupMalaysiaPostcode('43000');
    }
    const totalTime = performance.now() - start;
    const avgMicroseconds = (totalTime / runs) * 1000;
    console.log(`    Benchmark: 1,000 cached lookups took ${totalTime.toFixed(2)}ms (avg: ${avgMicroseconds.toFixed(2)} µs/op)`);
    assert.ok(avgMicroseconds < 50, 'Lookup took longer than 50 µs on cache hit');
  });

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  if (failedTests > 0) {
    console.error(`FAILED: ${failedTests} test(s) failed!`);
    process.exit(1);
  }
  console.log('ALL TESTS PASSED SUCCESSFULLY! (100% PASS)');
  console.log('======================================================\n');
}

runTestSuite().catch(err => {
  console.error('Fatal error running test suite:', err);
  process.exit(1);
});
