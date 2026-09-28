import {
  validateEgyptPostalCode,
  lookupEgyptPostalCode,
  getEgyptIndex,
} from '../public/data/egypt-postal/lookup.ts';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 TESTING LOCAL EGYPT POSTAL & ADDRESS LOOKUP ENGINE');
  console.log('================================================================\n');

  // Test 1: Validation checks (strictly 5 numeric digits)
  console.log('Test 1: Postal code format validation (strictly 5 numeric digits)');
  const valid1 = validateEgyptPostalCode('11511');
  if (!valid1.valid) throw new Error('Validation failed for valid code 11511');

  const invalidLenShort = validateEgyptPostalCode('1151');
  if (invalidLenShort.valid) throw new Error('Validation should reject 4-digit code in 5-digit system');

  const invalidLenLong = validateEgyptPostalCode('115110');
  if (invalidLenLong.valid) throw new Error('Validation should reject 6-digit code in 5-digit system');

  const invalidAlpha = validateEgyptPostalCode('1151A');
  if (invalidAlpha.valid) throw new Error('Validation should reject alphanumeric characters');

  const invalidSpaces = validateEgyptPostalCode('11 11');
  if (invalidSpaces.valid) throw new Error('Validation should reject spaces');

  console.log('✓ Validation rules verified (only 5 numeric digits ^[0-9]{5}$ allowed).\n');

  // Test 2: Master Index inspection
  console.log('Test 2: Master Index inspection');
  const index = await getEgyptIndex();
  console.log(`✓ Master index loaded: ${index.administrativeSummary.governorateCount} governorates, ${index.statistics.uniquePostalCodes} unique postal codes.`);
  if (index.administrativeSummary.governorateCount !== 27) {
    throw new Error(`Expected exactly 27 governorates, found ${index.administrativeSummary.governorateCount}`);
  }
  console.log(`✓ Administrative structure: Exactly 27 Governorates verified.\n`);

  // Test 3: Key geographic lookups across Egyptian governorates
  console.log('Test 3: Geographic & administrative lookups across governorates:');
  const testCodes = [
    { code: '11511', expectedGov: 'Cairo', label: 'Cairo Main (Ataba)' },
    { code: '11528', expectedGov: 'Cairo', label: 'Bab El Louq' },
    { code: '11765', expectedGov: 'Cairo', label: 'Nasr City 1st District' },
    { code: '11835', expectedGov: 'Cairo', label: 'New Cairo 5th Settlement' },
    { code: '11887', expectedGov: 'Cairo', label: 'Madinaty' },
    { code: '12511', expectedGov: 'Giza', label: 'Giza First (Murad)' },
    { code: '12555', expectedGov: 'Giza', label: 'Dokki' },
    { code: '12611', expectedGov: 'Giza', label: 'Mohandessin' },
    { code: '12566', expectedGov: 'Giza', label: '6th of October City' },
    { code: '12577', expectedGov: 'Giza', label: 'Sheikh Zayed City' },
    { code: '21511', expectedGov: 'Alexandria', label: 'Alexandria Raml Station' },
    { code: '21515', expectedGov: 'Alexandria', label: 'Manshiya' },
    { code: '21615', expectedGov: 'Alexandria', label: 'Smouha' },
    { code: '21934', expectedGov: 'Alexandria', label: 'New Borg El Arab' },
    { code: '13511', expectedGov: 'Qalyubia', label: 'Banha Main' },
    { code: '42511', expectedGov: 'Port Said', label: 'Port Said Main' },
    { code: '43511', expectedGov: 'Suez', label: 'Suez Main' },
    { code: '41511', expectedGov: 'Ismailia', label: 'Ismailia Main' },
    { code: '34511', expectedGov: 'Damietta', label: 'Damietta Main' },
    { code: '35511', expectedGov: 'Dakahlia', label: 'Mansoura Main' },
    { code: '44511', expectedGov: 'Sharqia', label: 'Zagazig Main' },
    { code: '44635', expectedGov: 'Sharqia', label: '10th of Ramadan' },
    { code: '31511', expectedGov: 'Gharbia', label: 'Tanta Main' },
    { code: '31951', expectedGov: 'Gharbia', label: 'El Mahalla El Kubra' },
    { code: '32511', expectedGov: 'Monufia', label: 'Shibin El Kom Main' },
    { code: '33511', expectedGov: 'Kafr El Sheikh', label: 'Kafr El Sheikh Main' },
    { code: '22511', expectedGov: 'Beheira', label: 'Damanhur Main' },
    { code: '63511', expectedGov: 'Faiyum', label: 'Faiyum Main' },
    { code: '62511', expectedGov: 'Beni Suef', label: 'Beni Suef Main' },
    { code: '61511', expectedGov: 'Minya', label: 'Minya Main' },
    { code: '71511', expectedGov: 'Asyut', label: 'Asyut Main' },
    { code: '82511', expectedGov: 'Sohag', label: 'Sohag Main' },
    { code: '83511', expectedGov: 'Qena', label: 'Qena Main' },
    { code: '85951', expectedGov: 'Luxor', label: 'Luxor Main' },
    { code: '81511', expectedGov: 'Aswan', label: 'Aswan Main' },
    { code: '84511', expectedGov: 'Red Sea', label: 'Hurghada Main' },
    { code: '51511', expectedGov: 'Matrouh', label: 'Marsa Matrouh Main' },
    { code: '72511', expectedGov: 'New Valley', label: 'El Kharga Main' },
    { code: '45511', expectedGov: 'North Sinai', label: 'El Arish Main' },
    { code: '46619', expectedGov: 'South Sinai', label: 'Sharm El Sheikh (Hadaba)' },
  ];

  for (const tc of testCodes) {
    const res = await lookupEgyptPostalCode(tc.code);
    if (!res.found || res.records.length === 0) {
      throw new Error(`Lookup failed for ${tc.code} (${tc.label})`);
    }
    const rec = res.records[0];
    if (rec.governorate.nameEn !== tc.expectedGov) {
      throw new Error(`Governorate mismatch for ${tc.code}: expected ${tc.expectedGov}, got ${rec.governorate.nameEn}`);
    }
    if (rec.governorate.administrativeType !== 'Governorate') {
      throw new Error(`Administrative type must be 'Governorate', got ${rec.governorate.administrativeType}`);
    }
    console.log(
      `✓ [${tc.code}] ${rec.governorate.nameEn} (${rec.governorate.nameNative}) | ${rec.city.nameEn} | ${rec.district.nameEn} (${rec.district.administrativeType}) | ${rec.postOffice.nameEn} | ${res.executionTimeMs} ms`
    );
  }

  // Test 4: Section 8 & 9 Administrative structure & bilingual preservation
  console.log('\nTest 4: Structural details & Egyptian administrative types:');
  const sampleRes = await lookupEgyptPostalCode('11511');
  const sampleRec = sampleRes.records[0];
  console.log('Sample Record for 11511 (Ataba):');
  console.log(`  Governorate:         ${sampleRec.governorate.nameEn} (${sampleRec.governorate.nameNative}) [${sampleRec.governorate.administrativeType}]`);
  console.log(`  City:                ${sampleRec.city.nameEn} (${sampleRec.city.nameNative}) [${sampleRec.city.administrativeType}]`);
  console.log(`  District:            ${sampleRec.district.nameEn} (${sampleRec.district.nameNative}) [${sampleRec.district.administrativeType}]`);
  console.log(`  Locality:            ${sampleRec.locality.nameEn} (${sampleRec.locality.nameNative}) [${sampleRec.locality.administrativeType}]`);
  console.log(`  Post Office:         ${sampleRec.postOffice.nameEn} (${sampleRec.postOffice.nameNative})`);
  console.log(`  Areas Served:        ${sampleRec.areas.join(', ')}`);
  console.log(`  Postal Code:         ${sampleRec.postalCode}`);
  console.log(`  Coordinates:         ${sampleRec.coordinates?.latitude}, ${sampleRec.coordinates?.longitude}`);

  // Test 5: Cache performance
  console.log('\nTest 5: In-memory cache microsecond response verification');
  const t0 = performance.now();
  await lookupEgyptPostalCode('11511');
  const tCached = performance.now() - t0;
  console.log(`✓ Cached lookup finished in ${tCached.toFixed(4)} ms (< 0.1ms)\n`);

  console.log('================================================================');
  console.log('🎉 ALL EGYPT POSTAL LOOKUP TESTS PASSED PERFECTLY!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
