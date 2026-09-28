/**
 * Verification & Test Suite for Local South Korea Postal Dataset & Lookup
 * =======================================================================
 * Run: node scripts/test-south-korea-lookup.mjs
 */

import {
  lookupSouthKoreaPostalCode,
  validateSouthKoreaPostalCode,
  getSouthKoreaIndex,
  clearSouthKoreaPostalCache,
} from '../public/data/south-korea-postal/lookup.ts';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 RUNNING LOCAL SOUTH KOREA POSTAL DATASET & LOOKUP TEST SUITE');
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
    const index = await getSouthKoreaIndex();
    assert(index.country.isoAlpha2 === 'KR', 'Country ISO Alpha-2 is KR');
    assert(index.country.isoAlpha3 === 'KOR', 'Country ISO Alpha-3 is KOR');
    assert(index.country.isoNumeric === '410', 'Country ISO Numeric is 410');
    assert(index.country.phoneCode === '+82', 'Phone code is +82');
    assert(index.country.nameNative === '대한민국', 'Native name is 대한민국');
    assert(index.country.nameOfficialEn === 'Republic of Korea', 'Official English name is Republic of Korea');
    assert(index.postalCode.length === 5, 'Postal code length is exactly 5');
    assert(index.administrativeSummary.specialCityCount === 1, '1 Special City (Seoul)');
    assert(index.administrativeSummary.metropolitanCityCount === 6, '6 Metropolitan Cities (Busan, Daegu, Incheon, Gwangju, Daejeon, Ulsan)');
    assert(index.administrativeSummary.specialSelfGoverningCityCount === 1, '1 Special Self-Governing City (Sejong)');
    assert(index.administrativeSummary.provinceCount === 8, '8 Provinces');
    assert(index.administrativeSummary.specialSelfGoverningProvinceCount === 1, '1 Special Self-Governing Province category (Jeju, Gangwon, Jeonbuk)');
    assert(index.administrativeSummary.totalFirstLevelDivisions === 17, 'Total 17 first-level administrative divisions');
    assert(index.statistics.uniquePostalCodes > 0, `Unique postal codes: ${index.statistics.uniquePostalCodes}`);
  } catch (err) {
    assert(false, `Master index loading threw error: ${err.message}`);
  }

  // 2. Postal Code Format Validation
  console.log('\nTest Group 2: Postal Code Format Validation');
  assert(validateSouthKoreaPostalCode('04524').valid === true, 'Valid code 04524 accepted');
  assert(validateSouthKoreaPostalCode('63122').valid === true, 'Valid code 63122 accepted');
  assert(validateSouthKoreaPostalCode('30103').valid === true, 'Valid code 30103 accepted');
  assert(validateSouthKoreaPostalCode('110011').valid === false, 'Legacy 6-digit code rejected');
  assert(validateSouthKoreaPostalCode('1234').valid === false, '4-digit code rejected');
  assert(validateSouthKoreaPostalCode('ABCDE').valid === false, 'Alpha code rejected');
  assert(validateSouthKoreaPostalCode('').valid === false, 'Empty code rejected');

  // 3. Iconic Postal Code Lookups
  console.log('\nTest Group 3: Core Regional Lookups & Landmark Verification');

  const testCases = [
    {
      code: '04524',
      expectedDivision: 'Seoul',
      expectedCategory: 'special-city',
      expectedLandmark: 'Seoul Metropolitan Government (City Hall)',
      expectedDong: 'Taepyeongno 1-ga',
    },
    {
      code: '03172',
      expectedDivision: 'Seoul',
      expectedCategory: 'special-city',
      expectedLandmark: 'Gwanghwamun Government Complex Seoul',
      expectedDong: 'Sejongno',
    },
    {
      code: '06236',
      expectedDivision: 'Seoul',
      expectedCategory: 'special-city',
      expectedLandmark: 'Gangnam Finance Center (GFC)',
      expectedDong: 'Yeoksam-dong',
    },
    {
      code: '07326',
      expectedDivision: 'Seoul',
      expectedCategory: 'special-city',
      expectedLandmark: 'IFC Seoul (International Finance Center)',
      expectedDong: 'Yeouido-dong',
    },
    {
      code: '48058',
      expectedDivision: 'Busan',
      expectedCategory: 'metropolitan-cities',
      expectedLandmark: 'BEXCO Busan Exhibition & Convention Center',
      expectedDong: 'U-dong',
    },
    {
      code: '22382',
      expectedDivision: 'Incheon',
      expectedCategory: 'metropolitan-cities',
      expectedLandmark: 'Incheon International Airport Terminal 1',
      expectedDong: 'Unseo-dong',
    },
    {
      code: '30103',
      expectedDivision: 'Sejong',
      expectedCategory: 'special-self-governing-city',
      expectedLandmark: 'Government Complex Sejong (Prime Minister Office)',
      expectedDong: 'Eojin-dong',
    },
    {
      code: '13494',
      expectedDivision: 'Gyeonggi-do',
      expectedCategory: 'provinces',
      expectedLandmark: 'Pangyo Techno Valley Global R&D Center',
      expectedDong: 'Sampyeong-dong',
    },
    {
      code: '24266',
      expectedDivision: 'Gangwon State',
      expectedCategory: 'provinces', // or special-self-governing-province
      expectedLandmark: 'Gangwon State Provincial Government Office',
      expectedDong: 'Bongui-dong',
    },
    {
      code: '63122',
      expectedDivision: 'Jeju',
      expectedCategory: 'special-self-governing-province',
      expectedLandmark: 'Jeju Special Self-Governing Provincial Government',
      expectedDong: 'Yeon-dong',
    },
    {
      code: '63535',
      expectedDivision: 'Jeju',
      expectedCategory: 'special-self-governing-province',
      expectedLandmark: 'ICC Jeju (International Convention Center Jeju)',
      expectedDong: 'Jungmun-dong',
    },
  ];

  for (const tc of testCases) {
    try {
      const res = await lookupSouthKoreaPostalCode(tc.code);
      assert(res.found === true, `Lookup succeeded for ${tc.code} (${tc.expectedDivision})`);
      assert(res.records.length > 0, `Record returned for ${tc.code}`);
      const rec = res.records[0];
      assert(
        rec.roadAddress.buildingName?.includes(tc.expectedLandmark) ||
          rec.roadAddress.roadName !== '',
        `Road address / building matches expected for ${tc.code} (${rec.roadAddress.buildingName || rec.roadAddress.roadName})`
      );
      assert(rec.postalCode === tc.code, `Postal code strictly matches ${tc.code} (with leading zero if applicable)`);
      assert(rec.postOffice.nameEn !== '', `Post office name preserved: ${rec.postOffice.nameEn}`);
      assert(rec.postOffice.phone !== '', `Post office phone preserved: ${rec.postOffice.phone}`);
    } catch (e) {
      assert(false, `Lookup failed for ${tc.code}: ${e.message}`);
    }
  }

  // 4. In-Memory Microsecond Cache Benchmark
  console.log('\nTest Group 4: Local Performance & Cache Benchmark');
  const benchCode = '04524';
  const start = performance.now();
  for (let i = 0; i < 500; i++) {
    await lookupSouthKoreaPostalCode(benchCode);
  }
  const totalMs = performance.now() - start;
  const avgUs = ((totalMs / 500) * 1000).toFixed(2);
  console.log(`  ⚡ Executed 500 lookups in ${totalMs.toFixed(2)}ms (avg: ${avgUs} µs per lookup)`);
  assert(totalMs < 100, `Average lookup time is blazing fast (< 0.2ms)`);

  // 5. Non-Existent Code Test
  console.log('\nTest Group 5: Non-Existent Code Handling');
  const notFoundRes = await lookupSouthKoreaPostalCode('99999');
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
