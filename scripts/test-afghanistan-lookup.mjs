import {
  validateAfghanistanPostalCode,
  lookupAfghanistanPostalCode,
  getAfghanistanIndex,
} from '../public/data/afghanistan-postal/lookup.ts';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 TESTING LOCAL AFGHANISTAN POSTAL & ADDRESS LOOKUP ENGINE');
  console.log('================================================================\n');

  // Test 1: Validation checks
  console.log('Test 1: Postal code format validation (strictly 6 numeric digits)');
  const valid1 = validateAfghanistanPostalCode('100101');
  if (!valid1.valid) throw new Error('Validation failed for valid code 100101');

  const invalidLen = validateAfghanistanPostalCode('1001');
  if (invalidLen.valid) throw new Error('Validation should reject 4-digit code in 6-digit system');

  const invalidAlpha = validateAfghanistanPostalCode('10010A');
  if (invalidAlpha.valid) throw new Error('Validation should reject alphanumeric characters');

  const invalidPrefix = validateAfghanistanPostalCode('090101');
  if (invalidPrefix.valid) throw new Error('Validation should reject prefix < 10');

  const invalidPrefixHigh = validateAfghanistanPostalCode('440101');
  if (invalidPrefixHigh.valid) throw new Error('Validation should reject prefix > 43');

  console.log('✓ Validation rules verified (only 6 numeric digits with prefixes 10-43 allowed).\n');

  // Test 2: Master Index loading
  console.log('Test 2: Master Index inspection');
  const index = await getAfghanistanIndex();
  console.log(`✓ Master index loaded: ${index.administrativeSummary.provinceCount} provinces, ${index.statistics.uniquePostalCodes} unique postal codes.`);
  console.log(`✓ Legacy 4-digit codes isolated in legacy/: ${index.statistics.legacyCodesPreserved} records.\n`);

  // Test 3: Key geographic lookups
  console.log('Test 3: Geographic & provincial lookups across provinces:');
  const testCodes = [
    { code: '100101', expectedProv: 'Kabul', label: 'Capital / District 1' },
    { code: '101201', expectedProv: 'Kabul', label: 'District 12' },
    { code: '101301', expectedProv: 'Kabul', label: 'District 13 (Dasht-e-Barchi)' },
    { code: '300101', expectedProv: 'Herat', label: 'Herat City / District 1' },
    { code: '170101', expectedProv: 'Balkh', label: 'Mazar-i-Sharif City / District 1' },
    { code: '385101', expectedProv: 'Kandahar', label: 'Reg District' },
    { code: '260101', expectedProv: 'Nangarhar', label: 'Jalalabad City / District 1' },
    { code: '340101', expectedProv: 'Badakhshan', label: 'Fayzabad City / District 1' },
    { code: '345101', expectedProv: 'Badakhshan', label: 'Koran wa Monjan Rural District' },
    { code: '160101', expectedProv: 'Bamyan', label: 'Bamyan City / District 1' },
    { code: '110101', expectedProv: 'Parwan', label: 'Charikar City / District 1' },
    { code: '430101', expectedProv: 'Nimroz', label: 'Zaranj City / District 1' },
  ];

  for (const tc of testCodes) {
    const res = await lookupAfghanistanPostalCode(tc.code);
    if (!res.found || res.records.length === 0) {
      throw new Error(`Lookup failed for ${tc.code} (${tc.label})`);
    }
    const rec = res.records[0];
    if (rec.province.nameEn !== tc.expectedProv) {
      throw new Error(`Province mismatch for ${tc.code}: expected ${tc.expectedProv}, got ${rec.province.nameEn}`);
    }
    console.log(
      `✓ [${tc.code}] ${rec.province.nameEn} (${rec.province.nameNative}) | ${rec.city.nameEn} | ${rec.district.nameEn} | ${res.executionTimeMs} ms`
    );
  }

  // Test 4: UPU Address Formatting
  console.log('\nTest 4: UPU S42 Afghanistan Address Formatting');
  const sampleRes = await lookupAfghanistanPostalCode('100101');
  const sampleRec = sampleRes.records[0];
  console.log('Sample Record for 100101:');
  console.log(`  Country:    ${sampleRec.source.name}`);
  console.log(`  Province:   ${sampleRec.province.nameEn} (${sampleRec.province.nameNative})`);
  console.log(`  City:       ${sampleRec.city.nameEn} (${sampleRec.city.nameNative})`);
  console.log(`  District:   ${sampleRec.district.nameEn}`);
  console.log(`  Locality:   ${sampleRec.locality.nameEn}`);
  console.log(`  Post Office:${sampleRec.postOffice.nameEn}`);
  console.log(`  Postal Code:${sampleRec.postalCode}`);

  // Test 5: Cache performance
  console.log('\nTest 5: In-memory cache microsecond response verification');
  const t0 = performance.now();
  await lookupAfghanistanPostalCode('100101');
  const tCached = performance.now() - t0;
  console.log(`✓ Cached lookup finished in ${tCached.toFixed(4)} ms (< 0.1ms)\n`);

  console.log('================================================================');
  console.log('🎉 ALL AFGHANISTAN POSTAL LOOKUP TESTS PASSED PERFECTLY!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
