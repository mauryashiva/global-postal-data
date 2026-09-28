/**
 * Comprehensive Automated Test Suite for Sri Lanka Postal & Administrative Lookup
 * ================================================================================
 * Location: scripts/test-sri-lanka-lookup.mjs
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const lookupPath = path.join(ROOT_DIR, 'public', 'data', 'sri-lanka-postal', 'lookup.ts');
const {
  lookupSriLankaPostcode,
  validateSriLankaPostcode,
  getSriLankaPostalIndex,
  clearSriLankaPostalCache
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
  console.log('STARTING SRI LANKA POSTAL LOOKUP TEST SUITE');
  console.log('======================================================\n');

  clearSriLankaPostalCache();

  // Test Group 1: Format Validation & Normalization
  console.log('Group 1: Postcode Format Validation & Normalization');
  it('Validates 5-digit canonical postcode "20000" (Kandy)', () => {
    const res = validateSriLankaPostcode('20000');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '20000');
  });

  it('Validates leading-zero postcode "00100" (Colombo 1 / Fort)', () => {
    const res = validateSriLankaPostcode('00100');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '00100');
  });

  it('Normalizes whitespace: " 00100 " -> "00100"', () => {
    const res = validateSriLankaPostcode(' 00100 ');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '00100');
  });

  it('Normalizes internal whitespace: "20 000" -> "20000"', () => {
    const res = validateSriLankaPostcode('20 000');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.normalized, '20000');
  });

  it('Rejects 4-digit postcode "2000"', () => {
    const res = validateSriLankaPostcode('2000');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('5 digits'));
  });

  it('Rejects 6-digit postcode "200000"', () => {
    const res = validateSriLankaPostcode('200000');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('5 digits'));
  });

  it('Rejects alphabetic/alphanumeric strings', () => {
    const res1 = validateSriLankaPostcode('20A00');
    const res2 = validateSriLankaPostcode('LK100');
    assert.strictEqual(res1.valid, false);
    assert.strictEqual(res2.valid, false);
  });

  // Test Group 2: Index & Administrative Integrity
  console.log('\nGroup 2: Dataset Index & Administrative Division Integrity');
  await itAsync('Loads index.json successfully with exactly 9 Provinces & 25 Districts', async () => {
    const index = await getSriLankaPostalIndex();
    assert.ok(index);
    assert.strictEqual(index.country.isoAlpha2, 'LK');
    assert.strictEqual(index.country.isoAlpha3, 'LKA');
    assert.strictEqual(index.country.isoNumeric, '144');
    assert.strictEqual(index.administrativeSummary.provinceCount, 9);
    assert.strictEqual(index.administrativeSummary.districtCount, 25);
    assert.strictEqual(index.provinces.length, 9);
    assert.strictEqual(index.districts.length, 25);
  });

  // Test Group 3: Core Runtime Lookups across Regions
  console.log('\nGroup 3: Offline Lookup & Administrative Resolution');
  await itAsync('Looks up 00100 (Colombo 1 / Fort - Double Leading Zero)', async () => {
    const res = await lookupSriLankaPostcode('00100');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '00100');
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Western Province');
    assert.strictEqual(m.district.nameEn, 'Colombo');
    assert.strictEqual(m.postalTown.nameEn, 'COLOMBO 1');
    assert.strictEqual(m.locality.nameEn, 'Fort');
    assert.strictEqual(m.country.isoAlpha2, 'LK');
  });

  await itAsync('Looks up 20000 (Kandy, Central Province)', async () => {
    const res = await lookupSriLankaPostcode('20000');
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '20000');
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Central Province');
    assert.strictEqual(m.district.nameEn, 'Kandy');
    assert.strictEqual(m.city.nameEn, 'Kandy');
    assert.strictEqual(m.province.nameSi, 'මධ්‍යම පළාත');
    assert.strictEqual(m.province.nameTa, 'மத்திய மாகாணம்');
  });

  await itAsync('Looks up 80000 (Galle, Southern Province)', async () => {
    const res = await lookupSriLankaPostcode('80000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Southern Province');
    assert.strictEqual(m.district.nameEn, 'Galle');
    assert.strictEqual(m.city.nameEn, 'Galle');
  });

  await itAsync('Looks up 40000 (Jaffna, Northern Province)', async () => {
    const res = await lookupSriLankaPostcode('40000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Northern Province');
    assert.strictEqual(m.district.nameEn, 'Jaffna');
    assert.strictEqual(m.city.nameEn, 'Jaffna');
    assert.strictEqual(m.city.nameTa, 'யாழ்ப்பாணம்');
  });

  await itAsync('Looks up 30000 (Batticaloa, Eastern Province)', async () => {
    const res = await lookupSriLankaPostcode('30000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Eastern Province');
    assert.strictEqual(m.district.nameEn, 'Batticaloa');
    assert.strictEqual(m.city.nameEn, 'Batticaloa');
  });

  await itAsync('Looks up 90000 (Badulla, Uva Province)', async () => {
    const res = await lookupSriLankaPostcode('90000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Uva Province');
    assert.strictEqual(m.district.nameEn, 'Badulla');
    assert.strictEqual(m.city.nameEn, 'Badulla');
  });

  await itAsync('Looks up 70000 (Ratnapura, Sabaragamuwa Province)', async () => {
    const res = await lookupSriLankaPostcode('70000');
    assert.strictEqual(res.found, true);
    const m = res.primaryMatch;
    assert.strictEqual(m.province.nameEn, 'Sabaragamuwa Province');
    assert.strictEqual(m.district.nameEn, 'Ratnapura');
    assert.strictEqual(m.city.nameEn, 'Ratnapura');
  });

  // Test Group 4: Multi-Match Disambiguation Preservation
  console.log('\nGroup 4: Multi-Match Locality Preservation');
  await itAsync('Preserves multiple locality matches for 00200 (Colombo 2 & Slave Island)', async () => {
    const res = await lookupSriLankaPostcode('00200');
    assert.strictEqual(res.found, true);
    assert.ok(res.matches.length >= 2, 'Should preserve both Colombo 2 and Slave Island');
    const names = res.matches.map(m => m.city.nameEn);
    assert.ok(names.includes('Colombo 2'));
    assert.ok(names.includes('Slave Island'));
  });

  await itAsync('Preserves multiple locality matches for 00800 (Colombo 8 & Borella)', async () => {
    const res = await lookupSriLankaPostcode('00800');
    assert.strictEqual(res.found, true);
    assert.ok(res.matches.length >= 2);
    const names = res.matches.map(m => m.city.nameEn);
    assert.ok(names.includes('Colombo 8'));
    assert.ok(names.includes('Borella'));
  });

  // Test Group 5: Edge cases, Cache & Benchmark
  console.log('\nGroup 5: Edge Cases, Cache & Performance');
  await itAsync('Handles unknown postal code "99999" gracefully', async () => {
    const res = await lookupSriLankaPostcode('99999');
    assert.strictEqual(res.found, false);
    assert.strictEqual(res.matches.length, 0);
  });

  await itAsync('Handles numeric input 20000 gracefully', async () => {
    const res = await lookupSriLankaPostcode(20000);
    assert.strictEqual(res.found, true);
    assert.strictEqual(res.postcode, '20000');
  });

  await itAsync('Cache hit executes in sub-millisecond time', async () => {
    // Prime cache
    await lookupSriLankaPostcode('20000');
    const start = performance.now();
    const runs = 1000;
    for (let i = 0; i < runs; i++) {
      await lookupSriLankaPostcode('20000');
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
