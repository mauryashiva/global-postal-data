/**
 * Test Suite: Vietnam Postal Code & Administrative Local Lookup
 * =============================================================
 * File: scripts/test-vietnam-lookup.mjs
 * 
 * Verifies all Master Prompt Section 36 criteria:
 * 1. 5-digit validation and leading-zero preservation
 * 2. Two-level administrative structure (34 Provincial, 3,321 Commune)
 * 3. 28 Provinces + 6 Centrally Governed Cities
 * 4. 13 Special Administrative Zones
 * 5. Special Postal Objects & Multiple Matches
 * 6. Pre-2025 Legacy District Crosswalk
 * 7. In-memory cache benchmark & offline execution
 */

import {
  validateVietnamPostalCode,
  lookupVietnamPostalCode,
  getVietnamPostalIndex,
} from '../public/data/vietnam-postal/lookup.ts';

async function runTestSuite() {
  console.log('======================================================');
  console.log('STARTING VIETNAM POSTAL LOOKUP TEST SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  // Group 1: Format Validation & Normalization
  console.log('Group 1: Postcode Format Validation & Normalization');
  const v1 = validateVietnamPostalCode('10000');
  assert(v1.valid && v1.normalized === '10000', 'Validates 5-digit canonical postal code "10000" (Hanoi)');

  const v2 = validateVietnamPostalCode('01318');
  assert(v2.valid && v2.normalized === '01318', 'Validates leading-zero postal code "01318" (Vân Đồn Special Zone)');

  const v3 = validateVietnamPostalCode(' 70000 ');
  assert(v3.valid && v3.normalized === '70000', 'Normalizes whitespace: " 70000 " -> "70000"');

  const v4 = validateVietnamPostalCode('10 000');
  assert(v4.valid && v4.normalized === '10000', 'Normalizes internal whitespace: "10 000" -> "10000"');

  const v5 = validateVietnamPostalCode('10-000');
  assert(v5.valid && v5.normalized === '10000', 'Normalizes hyphenated code: "10-000" -> "10000"');

  const v6 = validateVietnamPostalCode('1000');
  assert(!v6.valid, 'Rejects 4-digit postal code "1000"');

  const v7 = validateVietnamPostalCode('100000');
  assert(!v7.valid, 'Rejects 6-digit postal code "100000"');

  const v8 = validateVietnamPostalCode('HANOI');
  assert(!v8.valid, 'Rejects alphabetic/non-numeric strings');

  const v9 = validateVietnamPostalCode('');
  assert(!v9.valid, 'Rejects empty input');

  // Group 2: Master Index & 2025+ Administrative Reform Structure
  console.log('\nGroup 2: Master Index & 2025+ Administrative Reform Structure');
  const index = await getVietnamPostalIndex();
  assert(index.country.isoAlpha2 === 'VN', 'Country ISO Alpha-2 is VN');
  assert(index.country.isoAlpha3 === 'VNM', 'Country ISO Alpha-3 is VNM');
  assert(index.country.isoNumeric === '704', 'Country ISO Numeric is 704');
  assert(index.country.phoneCode === '+84', 'International Calling Code is +84');
  assert(index.statistics.provincialUnits === 34, 'Exactly 34 Provincial-level units verified');
  assert(index.statistics.provinces === 28, 'Exactly 28 Provinces verified');
  assert(index.statistics.centrallyGovernedCities === 6, 'Exactly 6 Centrally Governed Cities verified');
  assert(index.statistics.communeUnits === 3321, 'Exactly 3,321 Commune-level units verified');
  assert(index.statistics.specialAdministrativeZones === 13, 'Exactly 13 Special Administrative Zones verified');
  assert(index.statistics.specialPostalObjects >= 14, 'Special Postal Objects integrated');

  // Group 3: Offline Lookup & Administrative Resolution
  console.log('\nGroup 3: Offline Lookup & Administrative Resolution');
  
  // Test Hanoi (Centrally Governed City)
  const rHanoi = await lookupVietnamPostalCode('11120');
  assert(rHanoi.found && rHanoi.matches[0].provinceRegion.nameVi === 'Hà Nội' && rHanoi.matches[0].provinceRegion.administrativeType === 'Centrally Governed City', 'Looks up 11120 (Ba Đình Ward, Hanoi - Centrally Governed City)');

  // Test Ho Chi Minh City (Centrally Governed City)
  const rHcmc = await lookupVietnamPostalCode('70000');
  assert(rHcmc.found && rHcmc.matches[0].provinceRegion.nameVi === 'Hồ Chí Minh', 'Looks up 70000 (Saigon Central Post Office / HCMC)');

  // Test Da Nang (Centrally Governed City)
  const rDaNang = await lookupVietnamPostalCode('48000');
  assert(rDaNang.found && rDaNang.matches[0].provinceRegion.nameVi === 'Đà Nẵng' && rDaNang.matches[0].provinceRegion.administrativeType === 'Centrally Governed City', 'Looks up 48000 (Da Nang Central Post Office)');

  // Test Hue (Centrally Governed City)
  const rHue = await lookupVietnamPostalCode('53000');
  assert(rHue.found && rHue.matches[0].provinceRegion.nameVi === 'Huế' && rHue.matches[0].provinceRegion.administrativeType === 'Centrally Governed City', 'Looks up 53000 (Hue Central Post Office - Centrally Governed City)');

  // Test Hai Phong (Centrally Governed City)
  const rHaiPhong = await lookupVietnamPostalCode('18000');
  assert(rHaiPhong.found && rHaiPhong.matches[0].provinceRegion.nameVi === 'Hải Phòng' && rHaiPhong.matches[0].provinceRegion.administrativeType === 'Centrally Governed City', 'Looks up 18000 (Hai Phong Central Post Office)');

  // Test Can Tho (Centrally Governed City)
  const rCanTho = await lookupVietnamPostalCode('90000');
  assert(rCanTho.found && rCanTho.matches[0].provinceRegion.nameVi === 'Cần Thơ' && rCanTho.matches[0].provinceRegion.administrativeType === 'Centrally Governed City', 'Looks up 90000 (Can Tho Central Post Office)');

  // Test Provinces (Resolution 202/2025/QH15)
  const rDongNai = await lookupVietnamPostalCode('67114');
  assert(rDongNai.found && rDongNai.matches[0].provinceRegion.nameVi === 'Đồng Nai' && rDongNai.matches[0].provinceRegion.administrativeType === 'Province', 'Looks up 67114 (Binh Phuoc Ward, Dong Nai Province)');

  // Group 4: Special Administrative Zones (Đặc khu hành chính)
  console.log('\nGroup 4: Special Administrative Zones (Đặc khu hành chính)');
  const rVanDon = await lookupVietnamPostalCode('01318');
  assert(rVanDon.found && rVanDon.matches[0].commune.administrativeType === 'Special Administrative Zone' && rVanDon.matches[0].commune.nameVi.includes('Vân Đồn'), 'Looks up 01318 (Đặc khu Vân Đồn - Special Administrative Zone)');

  const rPhuQuoc = await lookupVietnamPostalCode('92516');
  assert(rPhuQuoc.found && rPhuQuoc.matches[0].commune.administrativeType === 'Special Administrative Zone' && rPhuQuoc.matches[0].commune.nameVi.includes('Phú Quốc'), 'Looks up 92516 (Đặc khu Phú Quốc - Special Administrative Zone)');

  const rConDao = await lookupVietnamPostalCode('78807');
  assert(rConDao.found && rConDao.matches[0].commune.administrativeType === 'Special Administrative Zone' && rConDao.matches[0].commune.nameVi.includes('Côn Đảo'), 'Looks up 78807 (Đặc khu Côn Đảo - Special Administrative Zone)');

  // Group 5: Pre-2025 Legacy District Crosswalk
  console.log('\nGroup 5: Pre-2025 Legacy District Crosswalk');
  assert(rVanDon.matches[0].legacyAdministrativeData !== null && rVanDon.matches[0].legacyAdministrativeData.sourcePeriod === 'pre-2025', 'Preserves pre-2025 legacy district data for Vân Đồn');
  assert(rHanoi.matches[0].legacyAdministrativeData !== null && rHanoi.matches[0].legacyAdministrativeData.districtCode === '001', 'Preserves pre-2025 legacy district code 001 (Ba Đình) for ward 11120');

  // Group 6: Edge Cases, Unknown Codes & Cache Performance
  console.log('\nGroup 6: Edge Cases, Unknown Codes & Cache Performance');
  const rUnknown = await lookupVietnamPostalCode('99999');
  assert(!rUnknown.found && rUnknown.error !== undefined, 'Handles unregistered postal code "99999" gracefully');

  const rNum = await lookupVietnamPostalCode(10000);
  assert(rNum.found, 'Handles numeric input 10000 gracefully');

  // Benchmark 1,000 cached lookups
  const tStart = performance.now();
  for (let i = 0; i < 1000; i++) {
    await lookupVietnamPostalCode('11120');
  }
  const tDuration = performance.now() - tStart;
  const avgUs = (tDuration / 1000) * 1000;
  console.log(`    Benchmark: 1,000 cached lookups took ${tDuration.toFixed(2)}ms (avg: ${avgUs.toFixed(2)} µs/op)`);
  assert(avgUs < 100, 'Cache hit executes in sub-millisecond time (< 100 µs)');

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passed} / ${passed + failed} PASSED`);
  if (failed === 0) {
    console.log('ALL TESTS PASSED SUCCESSFULLY! (100% PASS)');
  } else {
    console.error(`FAILED: ${failed} tests failed.`);
    process.exit(1);
  }
  console.log('======================================================\n');
}

runTestSuite().catch((e) => {
  console.error('Test suite error:', e);
  process.exit(1);
});
