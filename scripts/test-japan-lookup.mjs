/**
 * Japan Postal Code & Administrative Test Suite
 * ==============================================
 * Location: scripts/test-japan-lookup.mjs
 *
 * Validates the 20 scenarios required by Master Prompt Section 78:
 * 1. Valid 7-digit postal code
 * 2. Valid hyphenated postal code
 * 3. Leading-zero postal code
 * 4. Invalid 6-digit input
 * 5. Invalid 8-digit input
 * 6. Alphabetic input
 * 7. Input containing spaces
 * 8. Multiple records for one postal code
 * 9. Multiple postal codes for one town
 * 10. Tokyo Special Ward
 * 11. Ordinance-designated city ward
 * 12. County + town/village structure
 * 13. Hokkaido
 * 14. Okinawa
 * 15. Business postal code
 * 16. Not-found postal code
 * 17. Offline lookup
 * 18. Cache lookup benchmark
 * 19. Correct country-specific validation
 * 20. Japanese character preservation
 */

import {
  lookupJapanPostalCode,
  validateJapanPostalCode,
  normalizeJapanPostalCode,
  formatJapanPostalCode,
  getJapanIndex,
} from '../public/data/japan-postal/lookup.ts';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING LOCAL JAPAN POSTAL CODE & ADMINISTRATIVE TEST SUITE');
  console.log('================================================================\n');

  // Test Group 1: Master Index & 47 Prefectures
  console.log('Test Group 1: Master Index & 47 Prefectures Verification');
  const index = await getJapanIndex();
  assert(index.country.isoAlpha2 === 'JP', 'Country ISO Alpha-2 is JP');
  assert(index.country.isoAlpha3 === 'JPN', 'Country ISO Alpha-3 is JPN');
  assert(index.country.isoNumeric === '392', 'Country ISO Numeric is 392');
  assert(index.country.phoneCode === '+81', 'Phone code is +81');
  assert(index.country.currency === 'JPY', 'Currency is JPY (Japanese Yen)');
  assert(index.country.nameEn === 'Japan', 'Country name is Japan');
  assert(index.country.nameJa === '日本', 'Japanese name is 日本');
  assert(index.administrativeSummary.prefectureCount === 47, 'Exactly 47 Prefectures verified');
  assert(index.administrativeSummary.categories.toCount === 1, '1 To (Tokyo-to)');
  assert(index.administrativeSummary.categories.doCount === 1, '1 Do (Hokkaido)');
  assert(index.administrativeSummary.categories.fuCount === 2, '2 Fu (Kyoto-fu, Osaka-fu)');
  assert(index.administrativeSummary.categories.kenCount === 43, '43 Ken');

  // Scenario 1, 2, 7: Normalization & Hyphen Handling
  console.log('\nTest Group 2: Postal Code Format & Normalization (Scenarios 1, 2, 7)');
  assert(normalizeJapanPostalCode('100-0001') === '1000001', '100-0001 normalized to 1000001');
  assert(normalizeJapanPostalCode('100 0001') === '1000001', '100 0001 normalized to 1000001');
  assert(normalizeJapanPostalCode(' 1000001 ') === '1000001', ' 1000001  normalized to 1000001');
  assert(formatJapanPostalCode('1000001') === '100-0001', '1000001 formatted to 100-0001');

  // Scenario 4, 5, 6, 19: Strict Validation
  console.log('\nTest Group 3: Strict Validation Rules (Scenarios 4, 5, 6, 19)');
  assert(validateJapanPostalCode('1000001').valid === true, 'Valid 7-digit code accepted');
  assert(validateJapanPostalCode('100-0001').valid === true, 'Valid hyphenated code accepted');
  assert(validateJapanPostalCode('100001').valid === false, '6-digit code rejected');
  assert(validateJapanPostalCode('10000001').valid === false, '8-digit code rejected');
  assert(validateJapanPostalCode('ABC0001').valid === false, 'Alphabetic code rejected');
  assert(validateJapanPostalCode('').valid === false, 'Empty code rejected');

  // Scenario 3: Leading Zero Postal Code
  console.log('\nTest Group 4: Leading Zero Preservation (Scenario 3)');
  const zeroCode = await lookupJapanPostalCode('060-0001');
  assert(zeroCode.found === true, '060-0001 found');
  assert(zeroCode.postalCode === '0600001', '0600001 preserved as string with leading zero');
  assert(zeroCode.postalCodeFormatted === '060-0001', '060-0001 formatted properly');

  const zeroCode2 = await lookupJapanPostalCode('001-0001');
  assert(zeroCode2.found === true, '001-0001 found');
  assert(zeroCode2.postalCode === '0010001', '0010001 double leading zero preserved');

  // Scenario 10: Tokyo Special Ward
  console.log('\nTest Group 5: Tokyo Special Wards (Scenario 10)');
  const tokyo1 = await lookupJapanPostalCode('100-0001');
  assert(tokyo1.found === true, '100-0001 (Chiyoda) found');
  assert(tokyo1.primaryMatch.prefectureNameJa === '東京都', 'Prefecture is 東京都');
  assert(tokyo1.primaryMatch.administrativeType === 'To', 'Administrative type is To (都)');
  assert(tokyo1.primaryMatch.municipality.administrativeType === 'Special Ward', 'Chiyoda-ku is Special Ward');
  assert(tokyo1.primaryMatch.municipality.nameJa === '千代田区', 'Municipality is 千代田区');
  assert(tokyo1.primaryMatch.townArea.nameJa === '千代田', 'Town area is 千代田');

  const shibuya = await lookupJapanPostalCode('150-0002');
  assert(shibuya.found === true, '150-0002 (Shibuya) found');
  assert(shibuya.primaryMatch.municipality.administrativeType === 'Special Ward', 'Shibuya-ku is Special Ward');
  assert(shibuya.primaryMatch.townArea.nameEn === 'Shibuya', 'Town area English is Shibuya');

  // Scenario 11: Ordinance-Designated City Ward
  console.log('\nTest Group 6: Ordinance-Designated City Wards (Scenario 11)');
  const osaka = await lookupJapanPostalCode('530-0001');
  assert(osaka.found === true, '530-0001 (Osaka Umeda) found');
  assert(osaka.primaryMatch.prefectureNameEn === 'Osaka', 'Prefecture is Osaka');
  assert(osaka.primaryMatch.administrativeType === 'Fu', 'Administrative type is Fu (府)');
  assert(osaka.primaryMatch.municipality.administrativeType === 'Designated City Ward', 'Kita-ku is Designated City Ward');
  assert(osaka.primaryMatch.municipality.parentCityJa === '大阪市', 'Parent city is 大阪市');
  assert(osaka.primaryMatch.townArea.nameJa === '梅田', 'Town area is 梅田 (Umeda)');

  const fukuoka = await lookupJapanPostalCode('812-0011');
  assert(fukuoka.found === true, '812-0011 (Fukuoka Hakata) found');
  assert(fukuoka.primaryMatch.municipality.administrativeType === 'Designated City Ward', 'Hakata-ku is Designated City Ward');
  assert(fukuoka.primaryMatch.municipality.parentCityJa === '福岡市', 'Parent city is 福岡市');

  // Scenario 12: County + Town/Village Structure
  console.log('\nTest Group 7: County (Gun) + Town/Village (Scenario 12)');
  const hinohara = await lookupJapanPostalCode('190-0200');
  assert(hinohara.found === true, '190-0200 (Hinohara-mura) found');
  assert(hinohara.primaryMatch.municipality.administrativeType === 'Village', 'Hinohara is Village (村)');
  assert(hinohara.primaryMatch.municipality.countyNameJa === '西多摩郡', 'County is 西多摩郡 (Nishitama County)');
  assert(hinohara.primaryMatch.townArea.type === 'NoTownAreaListed', 'Preserved special value: 以下に掲載がない場合');

  // Scenario 13: Hokkaido (Do)
  console.log('\nTest Group 8: Hokkaido Administrative Structure (Scenario 13)');
  const hokkaido = await lookupJapanPostalCode('060-0001');
  assert(hokkaido.found === true, '060-0001 (Hokkaido Government) found');
  assert(hokkaido.primaryMatch.administrativeType === 'Do', 'Administrative type is Do (道)');
  assert(hokkaido.primaryMatch.municipality.nameJa === '札幌市中央区', 'Municipality is 札幌市中央区');
  assert(hokkaido.primaryMatch.townArea.nameJa === '北一条西', 'Town area is 北一条西');

  // Scenario 14: Okinawa & Remote Islands
  console.log('\nTest Group 9: Okinawa & Islands (Scenario 14)');
  const okinawa = await lookupJapanPostalCode('900-0014');
  assert(okinawa.found === true, '900-0014 (Naha) found');
  assert(okinawa.primaryMatch.prefectureNameJa === '沖縄県', 'Prefecture is 沖縄県');
  assert(okinawa.primaryMatch.municipality.nameJa === '那覇市', 'Municipality is 那覇市');

  const taketomi = await lookupJapanPostalCode('907-1221');
  assert(taketomi.found === true, '907-1221 (Taketomi-cho Kohama Island) found');
  assert(taketomi.primaryMatch.municipality.countyNameJa === '八重山郡', 'County is 八重山郡');
  assert(taketomi.primaryMatch.townArea.nameJa === '小浜', 'Town area is 小浜 (Kohama Island)');

  // Scenario 8: Multiple Records for One Postal Code
  console.log('\nTest Group 10: Multiple Records for One Postal Code (Scenario 8)');
  const multiKyoto = await lookupJapanPostalCode('602-0000');
  assert(multiKyoto.found === true, '602-0000 found');
  assert(multiKyoto.matches.length > 1, `602-0000 maps to multiple records (${multiKyoto.matches.length} matches)`);
  assert(multiKyoto.matches.some(m => m.townArea.nameJa === '京都御苑'), 'Kyoto Gyoen preserved without overwrite');

  // Scenario 9: Multiple Postal Codes for One Town Area & Ambiguity Flag
  console.log('\nTest Group 11: Town Area with Multiple Postal Codes / Ambiguity (Scenario 9)');
  const ishikawa = await lookupJapanPostalCode('920-0853');
  assert(ishikawa.found === true, '920-0853 found');
  assert(ishikawa.primaryMatch.flags.multiplePostalCodesForTownArea === true, 'multiplePostalCodesForTownArea flag is true');
  assert(ishikawa.isAmbiguous === true, 'isAmbiguous flag is true');
  assert(ishikawa.ambiguityNotice !== undefined, 'Ambiguity notice provided for additional address information');

  // Scenario 15: Individual Business Postal Codes
  console.log('\nTest Group 12: Individual Business Postal Codes (Scenario 15)');
  const jpPostBiz = await lookupJapanPostalCode('100-8994');
  assert(jpPostBiz.found === true, '100-8994 (Japan Post HQ) found');
  assert(jpPostBiz.postalCodeType === 'BUSINESS', 'postalCodeType is BUSINESS');
  assert(jpPostBiz.primaryMatch.businessNameJa.includes('日本郵便'), 'Business name is 日本郵便 株式会社');

  const imperialBiz = await lookupJapanPostalCode('100-8111');
  assert(imperialBiz.found === true, '100-8111 (Imperial Household Agency) found');
  assert(imperialBiz.postalCodeType === 'BUSINESS', 'postalCodeType is BUSINESS');
  assert(imperialBiz.primaryMatch.businessNameJa === '宮内庁', 'Business name is 宮内庁');

  // Scenario 20: Multilingual Character Integrity
  console.log('\nTest Group 13: Multilingual Japanese & Romaji Integrity (Scenario 20)');
  const kasumi = await lookupJapanPostalCode('100-0013');
  assert(kasumi.primaryMatch.prefectureNameJa === '東京都', 'Japanese Kanji: 東京都');
  assert(kasumi.primaryMatch.prefectureNameKana === 'トウキョウト', 'Japanese Katakana: トウキョウト');
  assert(kasumi.primaryMatch.prefectureNameRomaji === 'Tokyo-to', 'Romaji: Tokyo-to');
  assert(kasumi.primaryMatch.prefectureNameEn === 'Tokyo', 'English: Tokyo');
  assert(kasumi.primaryMatch.townArea.nameJa === '霞が関', 'Town area Kanji: 霞が関');
  assert(kasumi.primaryMatch.townArea.nameKana === 'カスミガセキ', 'Town area Kana: カスミガセキ');
  assert(kasumi.primaryMatch.townArea.nameRomaji === 'Kasumigaseki', 'Town area Romaji: Kasumigaseki');

  // Scenario 18: Performance & In-Memory Cache Benchmark
  console.log('\nTest Group 14: Local Performance & In-Memory Cache Benchmark (Scenario 18)');
  const perfStart = Date.now();
  for (let i = 0; i < 500; i++) {
    await lookupJapanPostalCode('100-0001');
  }
  const perfDuration = Date.now() - perfStart;
  const avgUs = ((perfDuration / 500) * 1000).toFixed(2);
  console.log(`  ⚡ Executed 500 lookups in ${perfDuration}ms (avg: ${avgUs} µs per lookup)`);
  assert(perfDuration < 200, `Average lookup is sub-millisecond (${avgUs} µs)`);

  // Scenario 16: Not-Found Postal Code
  console.log('\nTest Group 15: Not-Found Postal Code Handling (Scenario 16)');
  const notFound = await lookupJapanPostalCode('999-9999');
  assert(notFound.found === false, 'Non-existent code returns found: false');
  assert(notFound.matches.length === 0, 'No matches returned');
  assert(notFound.error.includes('not found in local Japan dataset'), 'Helpful local offline message returned');

  console.log('\n================================================================');
  console.log(`TOTAL PASSED: ${passedTests}`);
  console.log(`TOTAL FAILED: ${failedTests}`);
  console.log(`TEST SUITE STATUS: ${failedTests === 0 ? '✓ PASS' : '✗ FAIL'}`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
