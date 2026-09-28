/**
 * UK Postcode & Address Test Suite
 * =================================
 * Location: scripts/test-uk-lookup.mjs
 *
 * Validates:
 * 1. Postcode normalization and format verification (including SW1A 1AA, M1 1AE, EC1A 1BB, B33 8TH)
 * 2. Strict rejection of invalid postcodes (numeric only, letters only, too short, too long, malformed)
 * 3. 4 Constituent Countries (England, Scotland, Wales, Northern Ireland)
 * 4. Crown Dependencies (Jersey, Guernsey, Isle of Man) preserved separately from UK
 * 5. BFPO addresses (BF1 0AA, BF1 1AA, BF1 2AB) with isBFPO: true and shipping warnings
 * 6. Multi-address postcodes with premises selection
 * 7. Large User & PO Box classifications
 * 8. Postal geography (Post Town) vs Administrative geography (Local Authority/County)
 * 9. Sub-millisecond in-memory cache lookup performance
 */

import {
  lookupUKPostcode,
  validateUKPostcode,
  normalizeUKPostcode,
  getPostcodeArea,
  getUkIndex,
} from '../public/data/uk-postcodes/lookup.ts';

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
  console.log('🧪 RUNNING LOCAL UNITED KINGDOM POSTCODE & LOOKUP TEST SUITE');
  console.log('================================================================\n');

  // Test Group 1: Master Index & Geography
  console.log('Test Group 1: Master Index & Constituent Countries Verification');
  const index = await getUkIndex();
  assert(index.country.isoAlpha2 === 'GB', 'Country ISO Alpha-2 is GB (not UK)');
  assert(index.country.isoAlpha3 === 'GBR', 'Country ISO Alpha-3 is GBR');
  assert(index.country.isoNumeric === '826', 'Country ISO Numeric is 826');
  assert(index.country.phoneCode === '+44', 'Phone code is +44');
  assert(index.country.nameEn === 'United Kingdom', 'Country name is United Kingdom');
  assert(index.constituentCountries.length === 4, 'Exactly 4 Constituent Countries');
  assert(index.crownDependencies.length === 3, 'Exactly 3 Crown Dependencies');
  assert(
    !index.constituentCountries.some(c => c.nameEn === 'Jersey' || c.nameEn === 'Guernsey' || c.nameEn === 'Isle of Man'),
    'Crown Dependencies are NOT classified as UK constituent countries'
  );
  assert(index.statistics.uniquePostcodes > 0, `Unique postcodes count: ${index.statistics.uniquePostcodes}`);
  assert(index.statistics.totalAddressRecords > 0, `Total address records: ${index.statistics.totalAddressRecords}`);
  assert(index.statistics.bfpoRecords > 0, `BFPO records count: ${index.statistics.bfpoRecords}`);

  // Test Group 2: Normalization & Validation
  console.log('\nTest Group 2: Postcode Normalization & Validation');
  assert(normalizeUKPostcode('sw1a1aa') === 'SW1A 1AA', 'sw1a1aa normalized to SW1A 1AA');
  assert(normalizeUKPostcode(' SW1A1AA ') === 'SW1A 1AA', ' SW1A1AA  normalized to SW1A 1AA');
  assert(normalizeUKPostcode('SW1A-1AA') === 'SW1A 1AA', 'SW1A-1AA normalized to SW1A 1AA');
  assert(normalizeUKPostcode('m11ae') === 'M1 1AE', 'm11ae normalized to M1 1AE');
  assert(normalizeUKPostcode('ec1a 1bb') === 'EC1A 1BB', 'ec1a 1bb normalized to EC1A 1BB');
  assert(normalizeUKPostcode('b33 8th') === 'B33 8TH', 'b33 8th normalized to B33 8TH');

  assert(validateUKPostcode('SW1A 1AA').valid === true, 'SW1A 1AA valid');
  assert(validateUKPostcode('M1 1AE').valid === true, 'M1 1AE valid');
  assert(validateUKPostcode('B33 8TH').valid === true, 'B33 8TH valid');
  assert(validateUKPostcode('EC1A 1BB').valid === true, 'EC1A 1BB valid');
  assert(validateUKPostcode('12345').valid === false, 'Numeric only rejected');
  assert(validateUKPostcode('SW1A').valid === false, 'Too short (outward only) rejected');
  assert(validateUKPostcode('SW1A 1AAAA').valid === false, 'Too long rejected');
  assert(validateUKPostcode('ABCDEFG').valid === false, 'Letters only rejected');
  assert(validateUKPostcode('').valid === false, 'Empty code rejected');

  assert(getPostcodeArea('SW1A 1AA') === 'SW', 'getPostcodeArea("SW1A 1AA") returns SW');
  assert(getPostcodeArea('M1 1AE') === 'M', 'getPostcodeArea("M1 1AE") returns M');
  assert(getPostcodeArea('BT1 5GS') === 'BT', 'getPostcodeArea("BT1 5GS") returns BT');
  assert(getPostcodeArea('BF1 0AA') === 'BF', 'getPostcodeArea("BF1 0AA") returns BF');

  // Test Group 3: Core Constituent Countries Lookups
  console.log('\nTest Group 3: Lookups across England, Scotland, Wales, & Northern Ireland');

  // England - Buckingham Palace
  const sw1a1aa = await lookupUKPostcode('SW1A 1AA');
  assert(sw1a1aa.found === true, 'SW1A 1AA found');
  assert(sw1a1aa.constituentCountry === 'England', 'SW1A 1AA constituent country is England');
  assert(sw1a1aa.postTown === 'LONDON', 'SW1A 1AA Post Town is LONDON');
  assert(sw1a1aa.primaryRecord.localAuthority === 'City of Westminster', 'SW1A 1AA local authority is City of Westminster');
  assert(sw1a1aa.primaryRecord.isLargeUserPostcode === true, 'SW1A 1AA is Large User Postcode');
  assert(sw1a1aa.addresses[0].buildingName === 'Buckingham Palace', 'SW1A 1AA address is Buckingham Palace');

  // England - 10 Downing Street (Multi-address)
  const sw1a2aa = await lookupUKPostcode('SW1A 2AA');
  assert(sw1a2aa.found === true, 'SW1A 2AA found');
  assert(sw1a2aa.addresses.length >= 3, `SW1A 2AA has ${sw1a2aa.addresses.length} addresses (10, 11, 12 Downing St)`);
  assert(sw1a2aa.addresses.some(a => a.buildingNumber === '10'), '10 Downing St preserved');
  assert(sw1a2aa.addresses.some(a => a.buildingNumber === '11'), '11 Downing St preserved');

  // England - Manchester
  const m11ae = await lookupUKPostcode('M1 1AE');
  assert(m11ae.found === true, 'M1 1AE found');
  assert(m11ae.postTown === 'MANCHESTER', 'M1 1AE Post Town is MANCHESTER');
  assert(m11ae.primaryRecord.ceremonialCounty === 'Greater Manchester', 'M1 1AE ceremonial county is Greater Manchester');
  assert(m11ae.addresses.length >= 2, 'M1 1AE multi-suite addresses preserved');

  // England - Birmingham
  const b338th = await lookupUKPostcode('B33 8TH');
  assert(b338th.found === true, 'B33 8TH found');
  assert(b338th.postTown === 'BIRMINGHAM', 'B33 8TH Post Town is BIRMINGHAM');
  assert(b338th.primaryRecord.localAuthority === 'Birmingham City Council', 'B33 8TH local authority is Birmingham');

  // Scotland - Edinburgh Castle & Scottish Parliament
  const eh11yz = await lookupUKPostcode('EH1 1YZ');
  assert(eh11yz.found === true, 'EH1 1YZ found');
  assert(eh11yz.constituentCountry === 'Scotland', 'EH1 1YZ constituent country is Scotland');
  assert(eh11yz.postTown === 'EDINBURGH', 'EH1 1YZ Post Town is EDINBURGH');
  assert(eh11yz.addresses[0].buildingName === 'Edinburgh Castle', 'EH1 1YZ address is Edinburgh Castle');

  const eh991sp = await lookupUKPostcode('EH99 1SP');
  assert(eh991sp.found === true, 'EH99 1SP found');
  assert(eh991sp.addresses[0].buildingName === 'Scottish Parliament', 'EH99 1SP is Scottish Parliament');

  // Wales - Cardiff Castle & Senedd Cymru
  const cf103at = await lookupUKPostcode('CF10 3AT');
  assert(cf103at.found === true, 'CF10 3AT found');
  assert(cf103at.constituentCountry === 'Wales', 'CF10 3AT constituent country is Wales');
  assert(cf103at.postTown === 'CARDIFF', 'CF10 3AT Post Town is CARDIFF');

  const cf991sn = await lookupUKPostcode('CF99 1SN');
  assert(cf991sn.found === true, 'CF99 1SN found');
  assert(cf991sn.addresses[0].buildingName.includes('Senedd Cymru'), 'CF99 1SN is Senedd Cymru');

  // Northern Ireland - Belfast City Hall & Stormont
  const bt15gs = await lookupUKPostcode('BT1 5GS');
  assert(bt15gs.found === true, 'BT1 5GS found');
  assert(bt15gs.constituentCountry === 'Northern Ireland', 'BT1 5GS constituent country is Northern Ireland');
  assert(bt15gs.postTown === 'BELFAST', 'BT1 5GS Post Town is BELFAST');
  assert(bt15gs.primaryRecord.ceremonialCounty === 'County Antrim', 'BT1 5GS county is County Antrim');

  const bt43xx = await lookupUKPostcode('BT4 3XX');
  assert(bt43xx.found === true, 'BT4 3XX found');
  assert(bt43xx.addresses[0].buildingName === 'Parliament Buildings', 'BT4 3XX is Parliament Buildings / Stormont');

  // Test Group 4: Crown Dependencies (NOT part of the UK)
  console.log('\nTest Group 4: Crown Dependencies Verification');

  const je = await lookupUKPostcode('JE2 3RP');
  assert(je.found === true, 'JE2 3RP (Jersey) found');
  assert(je.isCrownDependency === true, 'JE2 3RP flagged as isCrownDependency');
  assert(je.primaryRecord.crownDependencyName === 'Jersey', 'JE2 3RP crownDependencyName is Jersey');
  assert(je.constituentCountry.includes('Crown Dependency'), 'JE2 3RP distinguished from UK constituent countries');

  const gy = await lookupUKPostcode('GY1 1AA');
  assert(gy.found === true, 'GY1 1AA (Guernsey) found');
  assert(gy.isCrownDependency === true, 'GY1 1AA flagged as isCrownDependency');
  assert(gy.primaryRecord.crownDependencyName === 'Guernsey', 'GY1 1AA crownDependencyName is Guernsey');

  const im = await lookupUKPostcode('IM1 1AA');
  assert(im.found === true, 'IM1 1AA (Isle of Man) found');
  assert(im.isCrownDependency === true, 'IM1 1AA flagged as isCrownDependency');
  assert(im.primaryRecord.crownDependencyName === 'Isle of Man', 'IM1 1AA crownDependencyName is Isle of Man');

  // Test Group 5: British Forces Post Office (BFPO)
  console.log('\nTest Group 5: British Forces Post Office (BFPO) Verification');

  const bf10aa = await lookupUKPostcode('BF1 0AA');
  assert(bf10aa.found === true, 'BF1 0AA found');
  assert(bf10aa.isBFPO === true, 'BF1 0AA flagged with isBFPO: true');
  assert(bf10aa.primaryRecord.bfpoNumber === 'BFPO 1', 'BF1 0AA bfpoNumber is BFPO 1');
  assert(bf10aa.shippingWarning !== null, 'BF1 0AA includes shippingWarning');

  const bf12ab = await lookupUKPostcode('BF1 2AB');
  assert(bf12ab.found === true, 'BF1 2AB found');
  assert(bf12ab.isBFPO === true, 'BF1 2AB flagged with isBFPO: true');
  assert(bf12ab.primaryRecord.bfpoNumber === 'BFPO 52', 'BF1 2AB bfpoNumber is BFPO 52 (Cyprus)');

  // Test Group 6: PO Box & Classification
  console.log('\nTest Group 6: PO Box & Classification Verification');
  const sw1v1aa = await lookupUKPostcode('SW1V 1AA');
  assert(sw1v1aa.found === true, 'SW1V 1AA found');
  assert(sw1v1aa.primaryRecord.isPoBox === true, 'SW1V 1AA isPoBox: true');
  assert(sw1v1aa.primaryRecord.poBoxNumber === 'PO Box 4501', 'SW1V 1AA poBoxNumber is PO Box 4501');

  // Test Group 7: Performance & Cache Benchmark
  console.log('\nTest Group 7: Local Performance & In-Memory Cache Benchmark');
  const perfStart = Date.now();
  for (let i = 0; i < 500; i++) {
    await lookupUKPostcode('SW1A 1AA');
  }
  const perfDuration = Date.now() - perfStart;
  const avgUs = ((perfDuration / 500) * 1000).toFixed(2);
  console.log(`  ⚡ Executed 500 lookups in ${perfDuration}ms (avg: ${avgUs} µs per lookup)`);
  assert(perfDuration < 200, `Average lookup is sub-millisecond (${avgUs} µs)`);

  // Test Group 8: Non-Existent Code Handling
  console.log('\nTest Group 8: Non-Existent Postcode Handling');
  const nonexistent = await lookupUKPostcode('ZE9 9ZZ');
  assert(nonexistent.found === false, 'Non-existent code returns found: false');
  assert(nonexistent.records.length === 0, 'No records returned for non-existent code');
  assert(nonexistent.error.includes('not found in local UK dataset'), 'Informative offline error message provided');

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
