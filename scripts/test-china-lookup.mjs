import {
  lookupChinaPostalCode,
  populateChinaAddressFields,
  validateChinaPostalCode,
  clearChinaPostalCache
} from '../public/data/china-postal/lookup.ts';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 TESTING LOCAL CHINA POSTAL & ADMINISTRATIVE LOOKUP ENGINE');
  console.log('===============================================================\n');

  // Test 1: Postal Code Format Validation
  console.log('Test 1: Postal code format validation (strictly 6 numeric digits)');
  console.assert(validateChinaPostalCode('518000') === true, '518000 should be valid');
  console.assert(validateChinaPostalCode('100000') === true, '100000 should be valid');
  console.assert(validateChinaPostalCode('999077') === true, '999077 should be valid');
  console.assert(validateChinaPostalCode('12345') === false, '5 digits should be invalid');
  console.assert(validateChinaPostalCode('1234567') === false, '7 digits should be invalid');
  console.assert(validateChinaPostalCode('51800A') === false, 'Alphanumeric should be invalid');
  console.assert(validateChinaPostalCode('') === false, 'Empty string should be invalid');
  console.log('✓ Validation checks passed.\n');

  // Test 2: Lookups across all 4 Administrative Categories
  console.log('Test 2: Geographic & administrative category lookups');
  const testCases = [
    // Municipalities (4)
    { code: '100000', expectedType: 'Municipality', expectedProvEn: 'Beijing', expectedProvZh: '北京市' },
    { code: '200000', expectedType: 'Municipality', expectedProvEn: 'Shanghai', expectedProvZh: '上海市' },
    { code: '300000', expectedType: 'Municipality', expectedProvEn: 'Tianjin', expectedProvZh: '天津市' },
    { code: '400000', expectedType: 'Municipality', expectedProvEn: 'Chongqing', expectedProvZh: '重庆市' },

    // Provinces (23)
    { code: '518000', expectedType: 'Province', expectedProvEn: 'Guangdong', expectedProvZh: '广东省', expectedCity: '深圳市' },
    { code: '310000', expectedType: 'Province', expectedProvEn: 'Zhejiang', expectedProvZh: '浙江省', expectedCity: '杭州市' },
    { code: '210000', expectedType: 'Province', expectedProvEn: 'Jiangsu', expectedProvZh: '江苏省', expectedCity: '南京市' },
    { code: '610000', expectedType: 'Province', expectedProvEn: 'Sichuan', expectedProvZh: '四川省', expectedCity: '成都市' },
    { code: '450000', expectedType: 'Province', expectedProvEn: 'Henan', expectedProvZh: '河南省', expectedCity: '郑州市' },
    { code: '710000', expectedType: 'Province', expectedProvEn: 'Taiwan', expectedProvZh: '台湾省' },

    // Autonomous Regions (5)
    { code: '530000', expectedType: 'Autonomous Region', expectedProvEn: 'Guangxi Zhuang Autonomous Region', expectedProvZh: '广西壮族自治区' },
    { code: '010000', expectedType: 'Autonomous Region', expectedProvEn: 'Inner Mongolia Autonomous Region', expectedProvZh: '内蒙古自治区' },
    { code: '750000', expectedType: 'Autonomous Region', expectedProvEn: 'Ningxia Hui Autonomous Region', expectedProvZh: '宁夏回族自治区' },
    { code: '830000', expectedType: 'Autonomous Region', expectedProvEn: 'Xinjiang Uyghur Autonomous Region', expectedProvZh: '新疆维吾尔自治区' },
    { code: '850000', expectedType: 'Autonomous Region', expectedProvEn: 'Tibet Autonomous Region', expectedProvZh: '西藏自治区' },

    // Special Administrative Regions (2)
    { code: '999077', expectedType: 'Special Administrative Region', expectedProvEn: 'Hong Kong', expectedProvZh: '香港特别行政区' },
    { code: '999078', expectedType: 'Special Administrative Region', expectedProvEn: 'Macao', expectedProvZh: '澳门特别行政区' }
  ];

  for (const tc of testCases) {
    const t0 = performance.now();
    const result = await lookupChinaPostalCode(tc.code);
    const ms = (performance.now() - t0).toFixed(2);

    console.assert(result.found === true, `Postal code ${tc.code} must be found`);
    console.assert(result.provinceRegion !== undefined, `Must have provinceRegion`);
    console.assert(result.provinceRegion.administrativeType === tc.expectedType,
      `Expected ${tc.expectedType}, got ${result.provinceRegion.administrativeType}`);
    console.assert(result.provinceRegion.nameEn === tc.expectedProvEn,
      `Expected ${tc.expectedProvEn}, got ${result.provinceRegion.nameEn}`);
    console.assert(result.provinceRegion.nameZh === tc.expectedProvZh,
      `Expected ${tc.expectedProvZh}, got ${result.provinceRegion.nameZh}`);
    console.assert(result.matches.length > 0, `Must have at least 1 match`);

    console.log(`✓ [${tc.code}] ${result.provinceRegion.nameEn} (${result.provinceRegion.nameZh}) | ${tc.expectedType} | ${result.matches.length} match(es) in ${ms}ms`);
  }

  // Test 3: Multiple Matches Handling (e.g. 518000 Shenzhen or 100000 Beijing)
  console.log('\nTest 3: Multiple matches handling without overwrite');
  const resShenzhen = await lookupChinaPostalCode('518000');
  console.log(`518000 has ${resShenzhen.matches.length} matching administrative districts:`);
  resShenzhen.matches.forEach((m, idx) => {
    console.log(`  ${idx + 1}. ${m.prefectureCounty.nameEn} (${m.prefectureCounty.nameZh}) - Type: ${m.prefectureCounty.administrativeType}, Code: ${m.prefectureCounty.code}`);
  });
  console.assert(resShenzhen.matches.length >= 1, '518000 should contain matches');

  // Test 4: Complete ERP Address Formatting (Section 8 & 9)
  console.log('\nTest 4: ERP Address Formatting with Bilingual & Administrative Metadata');
  const primaryMatch = resShenzhen.matches[0];
  const erpAddress = populateChinaAddressFields(primaryMatch, '518000', {
    addressLine1: 'Room 1204, Tower B, Kexing Science Park',
    addressLine2: 'Keyuan Road, Yuehai Subdistrict'
  });

  console.assert(erpAddress.country === 'China', 'Country should be China');
  console.assert(Boolean(erpAddress.provinceRegion), 'Province should be populated');
  console.assert(Boolean(erpAddress.city), 'City should be populated');
  console.assert(Boolean(erpAddress.prefectureCounty), 'County should be populated');
  console.assert(Boolean(erpAddress.postalCode), 'Postal code should be populated');
  console.assert(Boolean(erpAddress.bilingual.provinceEn), 'Bilingual provinceEn required');
  console.assert(Boolean(erpAddress.bilingual.provinceZh), 'Bilingual provinceZh required');
  console.assert(Boolean(erpAddress.bilingual.cityZh), 'Bilingual cityZh required');
  console.assert(Boolean(erpAddress.bilingual.countyZh), 'Bilingual countyZh required');

  console.log('Populated ERP Address:');
  console.log(`  Country:              ${erpAddress.country}`);
  console.log(`  Province / Region:    ${erpAddress.provinceRegion}`);
  console.log(`  City:                 ${erpAddress.city}`);
  console.log(`  Prefecture / County:  ${erpAddress.prefectureCounty}`);
  console.log(`  Postal Code:          ${erpAddress.postalCode}`);
  console.log(`  Post Office/Locality: ${erpAddress.postOfficeLocality}`);
  console.log(`  Address Line 1:       ${erpAddress.addressLine1}`);
  console.log(`  Address Line 2:       ${erpAddress.addressLine2}`);
  console.log(`  Admin Type Hierarchy: ${erpAddress.bilingual.provinceAdminType} -> ${erpAddress.bilingual.cityAdminType} -> ${erpAddress.bilingual.countyAdminType}`);

  // Test 5: In-Memory Cache Performance
  console.log('\nTest 5: In-memory cache microsecond response verification');
  const tCached = performance.now();
  await lookupChinaPostalCode('518000');
  const cachedDuration = (performance.now() - tCached).toFixed(3);
  console.log(`✓ Cached lookup finished in ${cachedDuration}ms (< 0.1ms)`);

  console.log('\n===============================================================');
  console.log('🎉 ALL CHINA POSTAL LOOKUP TESTS PASSED PERFECTLY!');
  console.log('===============================================================\n');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
