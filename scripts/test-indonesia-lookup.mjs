/**
 * Comprehensive Automated Test Suite for Indonesia Postal & Administrative Engine
 * ===============================================================================
 * Location: scripts/test-indonesia-lookup.mjs
 *
 * Implements verification across all 16 runtime test scenarios from Section 59
 * of the Master Prompt.
 */

import {
  lookupIndonesiaPostalCode,
  validateIndonesiaPostalCode,
  normalizeIndonesiaPostalCode,
  getIndonesiaIndex,
} from '../public/data/indonesia-postal/lookup.ts';

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

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING LOCAL INDONESIA POSTAL CODE & ADMINISTRATIVE TEST SUITE');
  console.log('================================================================\n');

  // Test Group 1: Master Index & 38 Provinces Verification
  console.log('Test Group 1: Master Index & 38 Provinces Verification');
  const index = await getIndonesiaIndex();
  assert(index.country.isoAlpha2 === 'ID', 'Country ISO Alpha-2 is ID');
  assert(index.country.isoAlpha3 === 'IDN', 'Country ISO Alpha-3 is IDN');
  assert(index.country.isoNumeric === '360', 'Country ISO Numeric is 360');
  assert(index.country.phoneCode === '+62', 'Phone code is +62');
  assert(index.country.currency === 'IDR', 'Currency is IDR');
  assert(index.country.nameEn === 'Republic of Indonesia', 'Official English name is Republic of Indonesia');
  assert(index.country.nameNative === 'Republik Indonesia', 'Native name is Republik Indonesia');
  assert(index.administrativeStructure.provinceCount === 38, 'Exactly 38 Provinces verified');

  // Verify Special Autonomy Provinces
  const jakarta = index.provinces?.find((p) => p.code === '31');
  assert(jakarta && jakarta.specialStatus?.includes('Special Capital'), 'DKI Jakarta preserved with Special Capital status');

  const jogja = index.provinces?.find((p) => p.code === '34');
  assert(jogja && jogja.specialStatus?.includes('Special Region'), 'DI Yogyakarta preserved with Special Region status');

  const aceh = index.provinces?.find((p) => p.code === '11');
  assert(aceh && aceh.specialStatus?.includes('Special Autonomous'), 'Aceh preserved with Special Autonomous status');

  const papuaBaratDaya = index.provinces?.find((p) => p.code === '96');
  assert(papuaBaratDaya && papuaBaratDaya.nameEn === 'Southwest Papua', 'New Province Papua Barat Daya (code 96) verified');

  const papuaSelatan = index.provinces?.find((p) => p.code === '93');
  assert(papuaSelatan && papuaSelatan.nameEn === 'South Papua', 'New Province Papua Selatan (code 93) verified');

  // Test Group 2: Postal Code Normalization & Validation (Scenarios 1, 2, 3, 4)
  console.log('\nTest Group 2: Postal Code Format & Validation (Scenarios 1, 2, 3, 4)');
  assert(normalizeIndonesiaPostalCode('40198') === '40198', '40198 normalizes correctly');
  assert(normalizeIndonesiaPostalCode(' 40198 ') === '40198', '40198 with spaces trims correctly');
  assert(normalizeIndonesiaPostalCode('40-198') === '40198', '40-198 with hyphen normalizes to 40198');

  assert(validateIndonesiaPostalCode('40198').valid === true, 'Valid 5-digit code accepted');
  assert(validateIndonesiaPostalCode('10110').valid === true, 'Valid 5-digit code 10110 accepted');
  assert(validateIndonesiaPostalCode('4019').valid === false, 'Invalid 4-digit code rejected');
  assert(validateIndonesiaPostalCode('401986').valid === false, 'Invalid 6-digit code rejected');
  assert(validateIndonesiaPostalCode('40A98').valid === false, 'Non-numeric input rejected');
  assert(validateIndonesiaPostalCode('abcde').valid === false, 'Alphabetic input rejected');
  assert(validateIndonesiaPostalCode('').valid === false, 'Empty code rejected');

  // Test Group 3: Leading Zero Handling & String Preservation (Scenario 5)
  console.log('\nTest Group 3: String Type & Leading Zero Preservation (Scenario 5)');
  const res10110 = await lookupIndonesiaPostalCode('10110');
  assert(res10110.found === true, 'Lookup for 10110 succeeded');
  assert(typeof res10110.postalCode === 'string', 'Postal code stored as string');
  assert(res10110.postalCode.length === 5, 'Postal code length is strictly 5 characters');

  // Test Group 4: Multiple Records for One Postal Code (Scenario 6)
  console.log('\nTest Group 4: Multiple Records for One Postal Code (Scenario 6)');
  assert(res10110.matches.length >= 2, 'Postal code 10110 maps to multiple records (2 matches)');
  const kelurahans = res10110.matches.map((m) => m.village.nameId);
  assert(kelurahans.includes('Kelurahan Gambir') && kelurahans.includes('Kelurahan Kebon Kelapa'), 'Both Gambir and Kebon Kelapa preserved without overwrite');

  // Test Group 5: Single Record Lookup (Scenario 7)
  console.log('\nTest Group 5: Single Record Postal Lookup (Scenario 7)');
  const res40198 = await lookupIndonesiaPostalCode('40198');
  assert(res40198.found === true, 'Lookup for 40198 (Bandung) succeeded');
  assert(res40198.matches.length === 1, 'Single record returned for 40198');
  assert(res40198.primaryMatch?.village.nameId === 'Kelurahan Sukaluyu', 'Kelurahan Sukaluyu verified');
  assert(res40198.primaryMatch?.rt === '03' && res40198.primaryMatch?.rw === '07', 'RT 03 / RW 07 preserved');

  // Test Group 6: Province Resolution (Scenario 9)
  console.log('\nTest Group 6: Correct Province Resolution (Scenario 9)');
  assert(res40198.primaryMatch?.province.code === '32', 'Province code is 32 (Jawa Barat)');
  assert(res40198.primaryMatch?.province.nameEn === 'West Java', 'Province English name is West Java');
  assert(res40198.primaryMatch?.province.nameId === 'Jawa Barat', 'Province Indonesian name is Jawa Barat');

  // Test Group 7: Kabupaten vs Kota Distinction (Scenario 10)
  console.log('\nTest Group 7: Kabupaten vs Kota Distinction (Scenario 10)');
  // Kota Bandung (City)
  assert(res40198.primaryMatch?.kabupatenKota.administrativeType === 'City', 'Kota Bandung is City');
  assert(res40198.primaryMatch?.kabupatenKota.nameId === 'Kota Bandung', 'Kota Bandung preserved');

  // Kabupaten Bandung (Regency)
  const resSoreang = await lookupIndonesiaPostalCode('40911');
  assert(resSoreang.found === true, 'Lookup for 40911 (Soreang) succeeded');
  assert(resSoreang.primaryMatch?.kabupatenKota.administrativeType === 'Regency', 'Kabupaten Bandung is Regency');
  assert(resSoreang.primaryMatch?.kabupatenKota.nameId === 'Kabupaten Bandung', 'Kabupaten Bandung preserved distinctly from Kota Bandung');

  // Kepulauan Seribu (Administrative Regency in Jakarta)
  const resSeribu = await lookupIndonesiaPostalCode('14530');
  assert(resSeribu.found === true, 'Lookup for 14530 (Kepulauan Seribu) succeeded');
  assert(resSeribu.primaryMatch?.kabupatenKota.administrativeType === 'Administrative Regency', 'Kepulauan Seribu is Administrative Regency');

  // Test Group 8: Kecamatan Resolution (Scenario 11)
  console.log('\nTest Group 8: Correct Kecamatan Resolution (Scenario 11)');
  assert(res40198.primaryMatch?.district.nameId === 'Kecamatan Cibeunying Kaler', 'Kecamatan Cibeunying Kaler verified');
  assert(res40198.primaryMatch?.district.administrativeType === 'District', 'Administrative type is District');

  // Test Group 9: Desa vs Kelurahan Distinction (Scenario 12)
  console.log('\nTest Group 9: Desa vs Kelurahan Distinction (Scenario 12)');
  // Urban Village (Kelurahan)
  assert(res40198.primaryMatch?.village.administrativeType === 'Urban Village', 'Kelurahan Sukaluyu is Urban Village');

  // Rural Village (Desa)
  assert(resSoreang.primaryMatch?.village.administrativeType === 'Village', 'Desa Pamekaran is Village (Desa)');
  assert(resSoreang.primaryMatch?.village.nameId === 'Desa Pamekaran', 'Desa Pamekaran preserved');

  // Test Group 10: Special Regions & National Landmarks
  console.log('\nTest Group 10: Special Regions & National Landmarks');
  // IKN Nusantara
  const resIKN = await lookupIndonesiaPostalCode('75571');
  assert(resIKN.found === true, 'Lookup for 75571 (IKN Nusantara Sepaku) succeeded');
  assert(resIKN.primaryMatch?.province.nameEn === 'East Kalimantan', 'IKN is in East Kalimantan');
  assert(resIKN.primaryMatch?.locality.nameId.includes('KIPP'), 'Kawasan Inti Pusat Pemerintahan (KIPP) verified');

  // Bali (Kuta)
  const resBali = await lookupIndonesiaPostalCode('80361');
  assert(resBali.found === true, 'Lookup for 80361 (Kuta Bali) succeeded');
  assert(resBali.primaryMatch?.kabupatenKota.nameId === 'Kabupaten Badung', 'Kuta is in Kabupaten Badung');

  // Yogyakarta Palace
  const resKraton = await lookupIndonesiaPostalCode('55122');
  assert(resKraton.found === true, 'Lookup for 55122 (Kraton Yogyakarta) succeeded');
  assert(resKraton.primaryMatch?.province.nameId === 'Daerah Istimewa Yogyakarta', 'Yogyakarta Palace is in DIY');

  // Aceh (Grand Mosque)
  const resAceh = await lookupIndonesiaPostalCode('23111');
  assert(resAceh.found === true, 'Lookup for 23111 (Banda Aceh) succeeded');
  assert(resAceh.primaryMatch?.village.nameId === 'Gampong Kampung Baru', 'Aceh Gampong preserved');

  // Papua (Jayapura)
  const resPapua = await lookupIndonesiaPostalCode('99111');
  assert(resPapua.found === true, 'Lookup for 99111 (Jayapura) succeeded');
  assert(resPapua.primaryMatch?.province.nameId === 'Papua', 'Jayapura is in Papua');

  // Papua Barat Daya (Sorong)
  const resSorong = await lookupIndonesiaPostalCode('98411');
  assert(resSorong.found === true, 'Lookup for 98411 (Sorong) succeeded');
  assert(resSorong.primaryMatch?.province.nameId === 'Papua Barat Daya', 'Sorong is in Southwest Papua');

  // Test Group 11: Unknown Postal Code Handling (Scenario 8)
  console.log('\nTest Group 11: Unknown Postal Code Handling (Scenario 8)');
  const resUnknown = await lookupIndonesiaPostalCode('99999');
  assert(resUnknown.found === false, 'Unknown postal code 99999 returns found: false');
  assert(resUnknown.matches.length === 0, 'No records returned for unknown code');
  assert(resUnknown.error?.includes('not found'), 'Helpful local error message provided');

  // Test Group 12: In-Memory Cache Performance Benchmark (Scenarios 14, 15)
  console.log('\nTest Group 12: In-Memory Cache Performance Benchmark (Scenarios 14, 15)');
  // Warm up cache
  await lookupIndonesiaPostalCode('40198');

  const iterations = 500;
  const benchStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await lookupIndonesiaPostalCode('40198');
  }
  const benchEnd = performance.now();
  const totalMs = benchEnd - benchStart;
  const avgUs = ((totalMs / iterations) * 1000).toFixed(2);
  console.log(`  ⚡ Executed ${iterations} lookups in ${totalMs.toFixed(2)}ms (avg: ${avgUs} µs per lookup)`);
  assert(Number(avgUs) < 100, `Average lookup is sub-millisecond (${avgUs} µs)`);

  // Final Summary
  console.log('\n================================================================');
  console.log(`TOTAL PASSED: ${passed}`);
  console.log(`TOTAL FAILED: ${failed}`);
  console.log(`TEST SUITE STATUS: ${failed === 0 ? '✓ PASS' : '✗ FAIL'}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
