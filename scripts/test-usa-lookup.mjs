/**
 * Verification & Test Suite for Local United States Postal Dataset & Lookup
 * =========================================================================
 * Run: node scripts/test-usa-lookup.mjs
 */

import {
  lookupUsaPostalCode,
  validateUsaPostalCode,
  getUsaIndex,
  clearUsaPostalCache,
} from '../public/data/usa-postal/lookup.ts';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING LOCAL UNITED STATES POSTAL DATASET & LOOKUP TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Master Index & Metadata Verification
  console.log('Test Group 1: Master Index & Metadata Verification');
  try {
    const index = await getUsaIndex();
    assert(index.country.isoAlpha2 === 'US', 'Country ISO Alpha-2 is US');
    assert(index.country.isoAlpha3 === 'USA', 'Country ISO Alpha-3 is USA');
    assert(index.country.isoNumeric === '840', 'Country ISO Numeric is 840');
    assert(index.country.phoneCode === '+1', 'Phone code is +1');
    assert(index.country.nameEn === 'United States', 'Name is United States');
    assert(index.country.nameOfficialEn === 'United States of America', 'Official name is United States of America');
    assert(index.postalSystem.zip5Length === 5, 'Standard ZIP code length is 5');
    assert(index.administrativeSummary.stateCount === 50, 'Exactly 50 States');
    assert(index.administrativeSummary.districtCount === 1, '1 District (District of Columbia)');
    assert(index.administrativeSummary.territoryCount === 5, '5 Territories (PR, GU, AS, MP, VI)');
    assert(index.administrativeSummary.militaryCount === 1, 'Military mail (APO/FPO/DPO) accounted for');
    assert(index.administrativeSummary.totalJurisdictions === 57, 'Total 57 administrative jurisdictions');
    assert(index.statistics.uniqueZip5 > 0, `Unique ZIP5 count: ${index.statistics.uniqueZip5}`);
    assert(index.statistics.uniqueZipPlus4 > 0, `Unique ZIP+4 count: ${index.statistics.uniqueZipPlus4}`);
  } catch (err) {
    assert(false, `Master index loading threw error: ${err.message}`);
  }

  // 2. Postal Code Format Validation
  console.log('\nTest Group 2: Postal Code Format Validation (ZIP5 & ZIP+4)');
  assert(validateUsaPostalCode('10001').valid === true, 'Standard 5-digit ZIP 10001 accepted');
  assert(validateUsaPostalCode('02108').valid === true, 'Leading zero 5-digit ZIP 02108 accepted');
  assert(validateUsaPostalCode('00901').valid === true, 'Territory leading zero 00901 accepted');
  assert(validateUsaPostalCode('10001-3838').valid === true, 'Standard ZIP+4 10001-3838 accepted');
  assert(validateUsaPostalCode('10001-3838').isZipPlus4 === true, 'ZIP+4 flag is true');
  assert(validateUsaPostalCode('902103607').valid === true, '9-digit unhyphenated ZIP accepted as ZIP+4');
  assert(validateUsaPostalCode('1000').valid === false, '4-digit code rejected');
  assert(validateUsaPostalCode('100001').valid === false, '6-digit unhyphenated code rejected');
  assert(validateUsaPostalCode('10001-123').valid === false, 'Malformed ZIP+4 rejected');
  assert(validateUsaPostalCode('ABCDE').valid === false, 'Alpha code rejected');
  assert(validateUsaPostalCode('').valid === false, 'Empty code rejected');

  // 3. Core Regional Lookups & Landmark Verification
  console.log('\nTest Group 3: Core Regional Lookups across States, District, Territories, & Military');

  const testCases = [
    {
      code: '10001',
      expectedState: 'New York',
      expectedCity: 'New York',
      expectedCounty: 'New York County',
      expectedType: 'STANDARD'
    },
    {
      code: '90210',
      expectedState: 'California',
      expectedCity: 'Beverly Hills',
      expectedCounty: 'Los Angeles County',
      expectedType: 'STANDARD'
    },
    {
      code: '60601',
      expectedState: 'Illinois',
      expectedCity: 'Chicago',
      expectedCounty: 'Cook County',
      expectedType: 'STANDARD'
    },
    {
      code: '33101',
      expectedState: 'Florida',
      expectedCity: 'Miami',
      expectedCounty: 'Miami-Dade County',
      expectedType: 'PO BOX'
    },
    {
      code: '20001',
      expectedState: 'District of Columbia',
      expectedCity: 'Washington',
      expectedCounty: 'District of Columbia',
      expectedType: 'STANDARD'
    },
    {
      code: '20500',
      expectedState: 'District of Columbia',
      expectedCity: 'Washington',
      expectedCounty: 'District of Columbia',
      expectedType: 'UNIQUE'
    },
    {
      code: '30339',
      expectedState: 'Georgia',
      expectedCity: 'Atlanta',
      expectedMultiCounty: true,
      expectedType: 'STANDARD'
    },
    {
      code: '00501',
      expectedState: 'New York',
      expectedCity: 'Holtsville',
      expectedCounty: 'Suffolk County',
      expectedType: 'UNIQUE'
    },
    {
      code: '00901',
      expectedState: 'Puerto Rico',
      expectedCity: 'San Juan',
      expectedCounty: 'San Juan Municipio',
      expectedType: 'STANDARD'
    },
    {
      code: '96910',
      expectedState: 'Guam',
      expectedCity: 'Hagåtña',
      expectedCounty: 'Guam',
      expectedType: 'STANDARD'
    },
    {
      code: '96799',
      expectedState: 'American Samoa',
      expectedCity: 'Pago Pago',
      expectedCounty: 'Eastern District',
      expectedType: 'STANDARD'
    },
    {
      code: '00801',
      expectedState: 'U.S. Virgin Islands',
      expectedCity: 'Saint Thomas',
      expectedCounty: 'St. Thomas Island',
      expectedType: 'PO BOX'
    },
    {
      code: '09012',
      expectedState: 'U.S. Armed Forces (Military Mail)',
      expectedCity: 'APO',
      expectedType: 'MILITARY'
    }
  ];

  for (const tc of testCases) {
    try {
      const res = await lookupUsaPostalCode(tc.code);
      assert(res.found === true, `Lookup succeeded for ${tc.code} (${tc.expectedState})`);
      assert(res.records.length > 0, `Record returned for ${tc.code}`);
      const rec = res.records[0];
      assert(rec.state.nameEn === tc.expectedState, `State matches ${tc.expectedState} for ${tc.code}`);
      assert(rec.primaryCity === tc.expectedCity, `Primary City matches ${tc.expectedCity} for ${tc.code}`);
      assert(rec.zipType === tc.expectedType, `ZIP Type matches ${tc.expectedType} for ${tc.code}`);

      if (tc.expectedCounty) {
        assert(rec.primaryCounty === tc.expectedCounty, `Primary County matches ${tc.expectedCounty} for ${tc.code}`);
      }
      if (tc.expectedMultiCounty) {
        assert(rec.counties && rec.counties.length > 1, `Multi-county relationship preserved for ${tc.code} (${rec.counties.map(c => c.name).join(', ')})`);
      }
    } catch (e) {
      assert(false, `Lookup failed for ${tc.code}: ${e.message}`);
    }
  }

  // 4. Granular ZIP+4 Lookup Verification
  console.log('\nTest Group 4: Granular ZIP+4 Lookup Verification');
  try {
    const plus4Res = await lookupUsaPostalCode('10001-3838');
    assert(plus4Res.found === true, 'ZIP+4 lookup succeeded for 10001-3838');
    assert(plus4Res.zipPlus4 === '10001-3838', 'Exact ZIP+4 preserved');
    assert(plus4Res.records[0].zip4 === '3838', '4-digit extension isolated');
  } catch (e) {
    assert(false, `ZIP+4 lookup error: ${e.message}`);
  }

  // 5. In-Memory Microsecond Cache Benchmark
  console.log('\nTest Group 5: Local Performance & Cache Benchmark');
  const benchCode = '10001';
  const start = performance.now();
  for (let i = 0; i < 500; i++) {
    await lookupUsaPostalCode(benchCode);
  }
  const totalMs = performance.now() - start;
  const avgUs = ((totalMs / 500) * 1000).toFixed(2);
  console.log(`  ⚡ Executed 500 lookups in ${totalMs.toFixed(2)}ms (avg: ${avgUs} µs per lookup)`);
  assert(totalMs < 100, `Average lookup time is blazing fast (< 0.2ms)`);

  // 6. Non-Existent Code Handling
  console.log('\nTest Group 6: Non-Existent Code Handling');
  const notFoundRes = await lookupUsaPostalCode('99999');
  assert(notFoundRes.found === false, 'Invalid/non-existent code 99999 returns found: false');
  assert(notFoundRes.records.length === 0, 'No records returned for non-existent code');
  assert(notFoundRes.error?.includes('not found'), 'Clear error message returned');

  console.log('\n================================================================');
  console.log(`TOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);
  console.log(`TEST SUITE STATUS: ${failed === 0 ? '✓ PASS' : '✗ FAIL'}`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
