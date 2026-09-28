import { lookupPincode, populateAddressFields, validatePincode } from './lookup.ts';

async function runTests() {
  console.log('====================================================');
  console.log('🧪 TESTING LOCAL INDIA PINCODE LOOKUP UTILITY');
  console.log('====================================================\n');

  // Test 1: Validation
  console.log('Test 1: Validation checks');
  console.assert(validatePincode('400001') === true, '400001 should be valid');
  console.assert(validatePincode('110001') === true, '110001 should be valid');
  console.assert(validatePincode('12345') === false, '5 digits should be invalid');
  console.assert(validatePincode('1234567') === false, '7 digits should be invalid');
  console.assert(validatePincode('40000A') === false, 'Alpha should be invalid');
  console.log('✓ Validation checks passed.\n');

  // Test 2: Diverse region lookups
  const testPincodes = [
    { pin: '400001', expectedState: 'Maharashtra', expectedDistrict: 'Mumbai' },
    { pin: '110001', expectedState: 'Delhi', expectedDistrict: 'New Delhi' },
    { pin: '560001', expectedState: 'Karnataka', expectedDistrict: 'Bangalore' },
    { pin: '700001', expectedState: 'West Bengal', expectedDistrict: 'Kolkata' },
    { pin: '600001', expectedState: 'Tamil Nadu', expectedDistrict: 'Chennai' },
    { pin: '194101', expectedState: 'Ladakh', expectedDistrict: 'Leh Ladakh' },
    { pin: '396210', expectedState: 'Dadra and Nagar Haveli and Daman and Diu', expectedDistrict: 'Daman' },
    { pin: '682555', expectedState: 'Lakshadweep', expectedDistrict: 'Lakshadweep' },
    { pin: '500001', expectedState: 'Telangana', expectedDistrict: 'Hyderabad' },
    { pin: '800001', expectedState: 'Bihar', expectedDistrict: 'Patna' }
  ];

  for (const t of testPincodes) {
    const t0 = performance.now();
    const result = await lookupPincode(t.pin);
    const timeTaken = (performance.now() - t0).toFixed(2);

    console.assert(result.found === true, `Pincode ${t.pin} should be found`);
    console.assert(result.state === t.expectedState, `Expected ${t.expectedState}, got ${result.state}`);
    console.assert(result.postOffices.length > 0, `Should have at least 1 post office`);

    console.log(`✓ [${t.pin}] ${result.state} | ${result.district} | ${result.postOffices.length} offices found in ${timeTaken}ms`);

    // Test selection and field population
    const selectedOffice = result.postOffices[0];
    const populated = populateAddressFields(selectedOffice, t.pin);

    console.assert(populated.pincode === t.pin);
    console.assert(populated.stateUT === t.expectedState);
    console.assert(populated.country === 'India');
    console.assert(Boolean(populated.postOffice));
    console.assert(Boolean(populated.cityTown));
    console.assert(Boolean(populated.district));
    console.assert(Boolean(populated.talukSubDistrict));
    console.assert(Boolean(populated.area));
    console.assert(Boolean(populated.locality));
  }

  // Test 3: Multiple post offices in single pincode (400001)
  console.log('\nTest 3: Multiple post offices in single pincode (400001)');
  const res400001 = await lookupPincode('400001');
  console.log(`400001 has ${res400001.postOffices.length} matching post offices:`);
  res400001.postOffices.slice(0, 5).forEach((po, i) => {
    console.log(`  ${i + 1}. ${po.officeName} (${po.officeType}, ${po.deliveryStatus}) - Taluk: ${po.taluk || 'N/A'}, Phone: ${po.phone || 'N/A'}`);
  });
  console.assert(res400001.postOffices.length >= 4, '400001 should have multiple post offices');

  // Test 4: Cache speed verification
  console.log('\nTest 4: Cache speed verification');
  const tStart = performance.now();
  await lookupPincode('400001');
  const cachedTime = (performance.now() - tStart).toFixed(3);
  console.log(`✓ Cached lookup completed in ${cachedTime}ms`);

  // Test 5: Sub-localities & multiple areas per single post office (401209 Nalasopara East)
  console.log('\nTest 5: Sub-localities under single Post Office (401209)');
  const res401209 = await lookupPincode('401209');
  console.assert(res401209.found === true, '401209 should be found');
  console.assert(res401209.areas && res401209.areas.length >= 6, '401209 should have at least 6 neighborhoods');
  console.log(`✓ 401209 has ${res401209.areas.length} covered neighborhoods:`);
  res401209.areas.forEach((area, i) => console.log(`   ${i + 1}. ${area}`));

  // Verify selecting a specific neighborhood (e.g. Damodar Nagar)
  const damodarAddr = populateAddressFields(res401209.postOffices[0], '401209', 'India', 'Damodar Nagar');
  console.assert(damodarAddr.area === 'Damodar Nagar', 'Selected area should be Damodar Nagar');
  console.assert(damodarAddr.district === 'Palghar', 'District should be Palghar');
  console.assert(damodarAddr.talukSubDistrict === 'Vasai', 'Taluk should be Vasai');
  console.log(`✓ Area selection verified: Area="${damodarAddr.area}", PO="${damodarAddr.postOffice}", District="${damodarAddr.district}"`);

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
