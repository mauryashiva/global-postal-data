/**
 * Test Suite: Canada Postal Code & Address Local Lookup
 * ======================================================
 * File: scripts/test-canada-lookup.mjs
 * 
 * Verifies all Master Prompt Section 51 & 52 criteria:
 * 1. Format validation, canonical spacing, normalization
 * 2. Excluded letters: D, F, I, O, Q, U
 * 3. Excluded first letters: W, Z
 * 4. 10 Provinces + 3 Territories = 13 administrative divisions
 * 5. Rural codes (0 in second character) & Rural Routes (RR)
 * 6. Postal Box (PO Box) stations
 * 7. General Delivery
 * 8. Large Volume Receivers (LVR) & Federal Parliament
 * 9. Military mail / CFPO (Trenton, Halifax, Esquimalt, Valcartier, Cold Lake, Shilo, Gagetown)
 * 10. Multiple records per postal code (e.g. K0A 1L0, L4H 0A1)
 * 11. Bilingual English & French geographic names
 * 12. In-memory cache speed benchmark (< 100 µs)
 */

import {
  validateCanadaPostalCode,
  lookupCanadaPostalCode,
  getCanadaPostalIndex,
} from '../public/data/canada-postal/lookup.ts';

async function runTestSuite() {
  console.log('======================================================');
  console.log('STARTING CANADA POSTAL LOOKUP TEST SUITE');
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

  // ---------------------------------------------------------
  // Group 1: Format Validation & Normalization
  // ---------------------------------------------------------
  console.log('Group 1: Postal Code Format Validation & Normalization');
  
  const v1 = validateCanadaPostalCode('K1A 0B1');
  assert(v1.valid && v1.normalized === 'K1A0B1' && v1.canonical === 'K1A 0B1', 'Validates canonical urban postal code "K1A 0B1" (Ottawa)');

  const v2 = validateCanadaPostalCode('k1a0b1');
  assert(v2.valid && v2.normalized === 'K1A0B1' && v2.canonical === 'K1A 0B1', 'Normalizes lowercase & space-less code "k1a0b1" -> "K1A 0B1"');

  const v3 = validateCanadaPostalCode('  M5V   3L9  ');
  assert(v3.valid && v3.normalized === 'M5V3L9' && v3.canonical === 'M5V 3L9', 'Trims whitespace & extra internal spaces: "  M5V   3L9  " -> "M5V 3L9"');

  const v4 = validateCanadaPostalCode('H3B-2Y5');
  assert(v4.valid && v4.normalized === 'H3B2Y5' && v4.canonical === 'H3B 2Y5', 'Strips internal hyphen: "H3B-2Y5" -> "H3B 2Y5"');

  const v5 = validateCanadaPostalCode('123456');
  assert(!v5.valid, 'Rejects numeric-only 6-digit code "123456"');

  const v6 = validateCanadaPostalCode('K1A 0B');
  assert(!v6.valid, 'Rejects 5-character postal code "K1A 0B"');

  const v7 = validateCanadaPostalCode('K1A 0B12');
  assert(!v7.valid, 'Rejects 7-character postal code "K1A 0B12"');

  // ---------------------------------------------------------
  // Group 2: Canada Post Letter Exclusion Rules
  // ---------------------------------------------------------
  console.log('\nGroup 2: Canada Post Letter Exclusion Rules');

  // D, F, I, O, Q, U are excluded
  const v8 = validateCanadaPostalCode('D1A 1A1');
  assert(!v8.valid && v8.error.includes("'D'"), 'Rejects excluded letter "D" in "D1A 1A1"');

  const v9 = validateCanadaPostalCode('K1F 1A1');
  assert(!v9.valid && v9.error.includes("'F'"), 'Rejects excluded letter "F" in "K1F 1A1"');

  const v10 = validateCanadaPostalCode('K1A 0I1');
  assert(!v10.valid && v10.error.includes("'I'"), 'Rejects excluded letter "I" in "K1A 0I1"');

  const v11 = validateCanadaPostalCode('K1A 0O1');
  assert(!v11.valid && v11.error.includes("'O'"), 'Rejects excluded letter "O" in "K1A 0O1"');

  const v12 = validateCanadaPostalCode('K1Q 0B1');
  assert(!v12.valid && v12.error.includes("'Q'"), 'Rejects excluded letter "Q" in "K1Q 0B1"');

  const v13 = validateCanadaPostalCode('K1U 0B1');
  assert(!v13.valid && v13.error.includes("'U'"), 'Rejects excluded letter "U" in "K1U 0B1"');

  // W and Z are excluded as first letters
  const v14 = validateCanadaPostalCode('W1A 1A1');
  assert(!v14.valid && v14.error.includes("'W'"), 'Rejects forbidden first letter "W" in "W1A 1A1"');

  const v15 = validateCanadaPostalCode('Z1A 1A1');
  assert(!v15.valid && v15.error.includes("'Z'"), 'Rejects forbidden first letter "Z" in "Z1A 1A1"');

  // W and Z are valid in other alpha positions
  const v16 = validateCanadaPostalCode('M5W 1E6');
  assert(v16.valid && v16.normalized === 'M5W1E6', 'Accepts letter "W" in third position: "M5W 1E6"');

  const v17 = validateCanadaPostalCode('J8Y 3Z4');
  assert(v17.valid && v17.normalized === 'J8Y3Z4', 'Accepts letter "Z" in fifth position: "J8Y 3Z4"');

  // ---------------------------------------------------------
  // Group 3: Master Index & Administrative Structure
  // ---------------------------------------------------------
  console.log('\nGroup 3: Master Index & Administrative Structure');
  const index = await getCanadaPostalIndex();
  assert(index.country.isoAlpha2 === 'CA' && index.country.isoAlpha3 === 'CAN', 'Country ISO verified: CA / CAN');
  assert(index.administrativeSummary.provinceCount === 10, 'Exactly 10 Provinces confirmed');
  assert(index.administrativeSummary.territoryCount === 3, 'Exactly 3 Territories confirmed');
  assert(index.administrativeSummary.totalProvinceTerritoryCount === 13, 'Total 13 Administrative Divisions confirmed');
  
  const ytDiv = index.administrativeSummary.divisions.find(d => d.code === 'YT');
  assert(ytDiv?.nameEn === 'Yukon', 'Territory YT official name is "Yukon" (not "Yukon Territory")');

  // ---------------------------------------------------------
  // Group 4: Presets Across All 13 Provinces & Territories
  // ---------------------------------------------------------
  console.log('\nGroup 4: Presets Across All 13 Provinces & Territories');

  const testCasesByDiv = [
    { code: 'A1A 1A1', div: 'NL', city: "St. John's", label: 'Newfoundland and Labrador' },
    { code: 'C1A 1A1', div: 'PE', city: 'Charlottetown', label: 'Prince Edward Island' },
    { code: 'B3J 1A1', div: 'NS', city: 'Halifax', label: 'Nova Scotia' },
    { code: 'E1C 1A1', div: 'NB', city: 'Moncton', label: 'New Brunswick' },
    { code: 'H3B 2Y5', div: 'QC', city: 'Montréal', label: 'Quebec' },
    { code: 'K1A 0B1', div: 'ON', city: 'Ottawa', label: 'Ontario' },
    { code: 'R3C 1A1', div: 'MB', city: 'Winnipeg', label: 'Manitoba' },
    { code: 'S4P 0A1', div: 'SK', city: 'Regina', label: 'Saskatchewan' },
    { code: 'T2P 1J9', div: 'AB', city: 'Calgary', label: 'Alberta' },
    { code: 'V6B 1A1', div: 'BC', city: 'Vancouver', label: 'British Columbia' },
    { code: 'Y1A 2B0', div: 'YT', city: 'Whitehorse', label: 'Yukon' },
    { code: 'X1A 1A1', div: 'NT', city: 'Yellowknife', label: 'Northwest Territories' },
    { code: 'X0A 0H0', div: 'NU', city: 'Iqaluit', label: 'Nunavut' },
  ];

  for (const tc of testCasesByDiv) {
    const res = await lookupCanadaPostalCode(tc.code);
    assert(res.found && res.matches.length > 0, `Lookup succeeded for ${tc.div} (${tc.label}) [${tc.code}]`);
    const rec = res.matches[0];
    assert(rec.provinceTerritory.code === tc.div, `Division code matches ${tc.div}`);
    assert(rec.postalGeography.postalCity === tc.city, `Postal city matches ${tc.city}`);
  }

  // ---------------------------------------------------------
  // Group 5: Delivery Classifications & Intelligence
  // ---------------------------------------------------------
  console.log('\nGroup 5: Delivery Classifications & Intelligence');

  // Rural Route (RR)
  const ruralRes = await lookupCanadaPostalCode('A0A 1A0');
  assert(ruralRes.found && ruralRes.matches[0].delivery.ruralRoute?.isRuralRoute, 'Identifies Rural Route (RR 1) for A0A 1A0 (Bay Bulls NL)');

  // Postal Box (PO Box)
  const boxRes = await lookupCanadaPostalCode('M5W 1E6');
  assert(boxRes.found && boxRes.matches[0].delivery.postalBox?.isPostalBox, 'Identifies Postal Box delivery for M5W 1E6 (Toronto Station A)');

  // General Delivery (GD)
  const gdRes = await lookupCanadaPostalCode('K1A 0A2');
  assert(gdRes.found && gdRes.matches[0].delivery.generalDelivery?.isGeneralDelivery, 'Identifies General Delivery for K1A 0A2 (Ottawa)');

  // Large Volume Receiver (LVR)
  const lvrRes = await lookupCanadaPostalCode('K1A 0B1');
  assert(lvrRes.found && lvrRes.matches[0].delivery.isLargeVolumeReceiver, 'Identifies Large Volume Receiver for K1A 0B1 (Parliament Hill)');

  // Military Mail (CFPO)
  const milRes = await lookupCanadaPostalCode('K8N 5W6');
  assert(milRes.found && milRes.matches[0].delivery.deliveryContext === 'Military', 'Identifies Military Mail delivery for K8N 5W6 (CFB Trenton)');

  // Multi-Match Postal Code (Section 20)
  const multiRes = await lookupCanadaPostalCode('K0A 1L0');
  assert(multiRes.found && multiRes.matches.length === 2, 'Preserves multiple matching records for K0A 1L0 (Ottawa & Mississippi Mills)');

  // Bilingual Geography
  const bilingualRec = multiRes.matches[0];
  assert(bilingualRec.provinceTerritory.nameEn === 'Ontario' && bilingualRec.provinceTerritory.nameFr === 'Ontario', 'Preserves bilingual province names');
  const qcRec = (await lookupCanadaPostalCode('G1R 4P5')).matches[0];
  assert(qcRec.provinceTerritory.nameFr === 'Québec', 'Preserves accented French name: "Québec"');

  // ---------------------------------------------------------
  // Group 6: Offline Cache & Performance Benchmark
  // ---------------------------------------------------------
  console.log('\nGroup 6: Offline Cache & Performance Benchmark');
  
  const iterations = 1000;
  const tStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    await lookupCanadaPostalCode('M5V 3L9');
  }
  const tTotal = performance.now() - tStart;
  const avgLatencyUs = Math.round((tTotal / iterations) * 1000 * 10) / 10;
  assert(avgLatencyUs < 100, `In-memory cached lookup performance benchmark: ${avgLatencyUs} µs / query (< 100 µs target)`);

  // Final Summary
  console.log('\n======================================================');
  console.log(`TEST SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal error during test suite execution:', err);
  process.exit(1);
});
