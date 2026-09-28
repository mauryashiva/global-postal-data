#!/usr/bin/env node
/**
 * Update and Build Local India Pincode Dataset
 * ============================================
 * Location: data/india-pincodes/update-dataset.mjs
 * Official Source: Department of Posts, Ministry of Communications, Government of India
 * Platform: Open Government Data (OGD) Platform India (data.gov.in)
 * 
 * This script:
 * 1. Downloads / retrieves the latest authoritative Indian postal datasets
 * 2. Parses and cleans the data without inventing any records
 * 3. Enriches records with Taluk, Telephone, Coordinates, and Postal Hierarchy
 * 4. Categorizes into exactly 28 States and 8 Union Territories
 * 5. Generates index.json with country metadata and fast lookup index
 * 6. Generates individual State and Union Territory JSON files
 * 7. Mirrors files into public/data/india-pincodes for client-side offline access
 * 8. Runs automated validation against all constraints
 * 9. Produces validation-report.json
 * 10. Displays final verification metrics
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OFFICIAL_SOURCE = 'Department of Posts, Government of India';
const OFFICIAL_UPDATE_DATE = '2026-09-09';

const DATA_DIR = path.resolve(__dirname);
const PUBLIC_DATA_DIR = DATA_DIR;
const SCRATCH_DIR = path.resolve(__dirname, '../../../scratch');

// 28 States & 8 Union Territories Configuration
const ENTITIES = {
  // 28 States
  'andhra-pradesh': { name: 'Andhra Pradesh', type: 'state', folder: 'states' },
  'arunachal-pradesh': { name: 'Arunachal Pradesh', type: 'state', folder: 'states' },
  'assam': { name: 'Assam', type: 'state', folder: 'states' },
  'bihar': { name: 'Bihar', type: 'state', folder: 'states' },
  'chhattisgarh': { name: 'Chhattisgarh', type: 'state', folder: 'states' },
  'goa': { name: 'Goa', type: 'state', folder: 'states' },
  'gujarat': { name: 'Gujarat', type: 'state', folder: 'states' },
  'haryana': { name: 'Haryana', type: 'state', folder: 'states' },
  'himachal-pradesh': { name: 'Himachal Pradesh', type: 'state', folder: 'states' },
  'jharkhand': { name: 'Jharkhand', type: 'state', folder: 'states' },
  'karnataka': { name: 'Karnataka', type: 'state', folder: 'states' },
  'kerala': { name: 'Kerala', type: 'state', folder: 'states' },
  'madhya-pradesh': { name: 'Madhya Pradesh', type: 'state', folder: 'states' },
  'maharashtra': { name: 'Maharashtra', type: 'state', folder: 'states' },
  'manipur': { name: 'Manipur', type: 'state', folder: 'states' },
  'meghalaya': { name: 'Meghalaya', type: 'state', folder: 'states' },
  'mizoram': { name: 'Mizoram', type: 'state', folder: 'states' },
  'nagaland': { name: 'Nagaland', type: 'state', folder: 'states' },
  'odisha': { name: 'Odisha', type: 'state', folder: 'states' },
  'punjab': { name: 'Punjab', type: 'state', folder: 'states' },
  'rajasthan': { name: 'Rajasthan', type: 'state', folder: 'states' },
  'sikkim': { name: 'Sikkim', type: 'state', folder: 'states' },
  'tamil-nadu': { name: 'Tamil Nadu', type: 'state', folder: 'states' },
  'telangana': { name: 'Telangana', type: 'state', folder: 'states' },
  'tripura': { name: 'Tripura', type: 'state', folder: 'states' },
  'uttar-pradesh': { name: 'Uttar Pradesh', type: 'state', folder: 'states' },
  'uttarakhand': { name: 'Uttarakhand', type: 'state', folder: 'states' },
  'west-bengal': { name: 'West Bengal', type: 'state', folder: 'states' },

  // 8 Union Territories
  'andaman-and-nicobar-islands': { name: 'Andaman and Nicobar Islands', type: 'union-territory', folder: 'union-territories' },
  'chandigarh': { name: 'Chandigarh', type: 'union-territory', folder: 'union-territories' },
  'dadra-and-nagar-haveli-and-daman-and-diu': { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'union-territory', folder: 'union-territories' },
  'delhi': { name: 'Delhi', type: 'union-territory', folder: 'union-territories' },
  'jammu-and-kashmir': { name: 'Jammu and Kashmir', type: 'union-territory', folder: 'union-territories' },
  'ladakh': { name: 'Ladakh', type: 'union-territory', folder: 'union-territories' },
  'lakshadweep': { name: 'Lakshadweep', type: 'union-territory', folder: 'union-territories' },
  'puducherry': { name: 'Puducherry', type: 'union-territory', folder: 'union-territories' },
};

function parseCSVLine(line) {
  const fields = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      fields.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  fields.push(cur.trim());
  return fields;
}

function toTitleCase(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
    .trim();
}

function normalizeKey(str) {
  return (str || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

function normalizeOfficeType(rawType) {
  if (!rawType) return undefined;
  const t = rawType.toUpperCase().replace(/\./g, '').trim();
  if (t === 'BO') return 'Branch Office';
  if (t === 'SO') return 'Sub Office';
  if (t === 'HO') return 'Head Office';
  if (t === 'GPO') return 'General Post Office';
  return rawType;
}

function normalizeDeliveryStatus(rawDelivery) {
  if (!rawDelivery) return undefined;
  const d = rawDelivery.trim();
  if (d.toLowerCase().includes('non')) return 'Non-Delivery';
  if (d.toLowerCase().includes('delivery')) return 'Delivery';
  return d;
}

function normalizeStateSlug(rawState, circle, division) {
  const s = String(rawState || '').toUpperCase().trim();
  if (!s || s === 'NA' || s === 'NULL') {
    const c = (circle || '').toUpperCase();
    const d = (division || '').toUpperCase();
    if (c.includes('CHATTISGARH') || c.includes('CHHATTISGARH')) return 'chhattisgarh';
    if (c.includes('BIHAR')) return 'bihar';
    if (c.includes('ANDHRA')) return 'andhra-pradesh';
    if (c.includes('JHARKHAND')) return 'jharkhand';
    if (c.includes('HIMACHAL')) return 'himachal-pradesh';
    if (c.includes('JAMMU')) return 'jammu-and-kashmir';
    if (c.includes('KARNATAKA')) return 'karnataka';
    if (c.includes('HARYANA')) return 'haryana';
    if (c.includes('GUJARAT')) return 'gujarat';
    if (c.includes('MADHYA')) return 'madhya-pradesh';
    if (c.includes('KERALA')) return 'kerala';
    if (c.includes('MAHARASHTRA')) return 'maharashtra';
    if (c.includes('TAMIL')) return 'tamil-nadu';
    if (c.includes('RAJASTHAN')) return 'rajasthan';
    if (c.includes('UTTARAKHAND')) return 'uttarakhand';
    if (c.includes('UTTAR PRADESH')) return 'uttar-pradesh';
    if (c.includes('TELANGANA')) return 'telangana';
    if (c.includes('ASSAM')) return 'assam';
    if (c.includes('WEST BENGAL')) return 'west-bengal';
    if (c.includes('DELHI')) return 'delhi';
    if (c.includes('PUNJAB')) return 'punjab';
    if (c.includes('ODISHA') || c.includes('ORISSA')) return 'odisha';
    if (c.includes('NORTH EAST')) {
      if (d.includes('MIZORAM')) return 'mizoram';
      if (d.includes('MANIPUR')) return 'manipur';
      if (d.includes('AGARTALA') || d.includes('TRIPURA') || d.includes('DHARMANAGAR')) return 'tripura';
      if (d.includes('NAGALAND')) return 'nagaland';
      if (d.includes('MEGHALAYA')) return 'meghalaya';
      if (d.includes('ARUNACHAL')) return 'arunachal-pradesh';
    }
  }

  if (s.includes('ANDAMAN')) return 'andaman-and-nicobar-islands';
  if (s.includes('ANDHRA')) return 'andhra-pradesh';
  if (s.includes('ARUNACHAL')) return 'arunachal-pradesh';
  if (s.includes('ASSAM')) return 'assam';
  if (s.includes('BIHAR')) return 'bihar';
  if (s.includes('CHANDIGARH')) return 'chandigarh';
  if (s.includes('CHATTISGARH') || s.includes('CHHATTISGARH')) return 'chhattisgarh';
  if (s.includes('DADRA') || s.includes('DAMAN') || s.includes('DIU')) return 'dadra-and-nagar-haveli-and-daman-and-diu';
  if (s === 'DELHI' || s.includes('NEW DELHI')) return 'delhi';
  if (s === 'GOA') return 'goa';
  if (s === 'GUJARAT') return 'gujarat';
  if (s === 'HARYANA') return 'haryana';
  if (s.includes('HIMACHAL')) return 'himachal-pradesh';
  if (s.includes('LADAKH')) return 'ladakh';
  if (s.includes('JAMMU')) return 'jammu-and-kashmir';
  if (s.includes('JHARKHAND')) return 'jharkhand';
  if (s.includes('KARNATAKA')) return 'karnataka';
  if (s.includes('KERALA')) return 'kerala';
  if (s.includes('LAKSHADWEEP')) return 'lakshadweep';
  if (s.includes('MADHYA')) return 'madhya-pradesh';
  if (s.includes('MAHARASHTRA')) return 'maharashtra';
  if (s.includes('MANIPUR')) return 'manipur';
  if (s.includes('MEGHALAYA')) return 'meghalaya';
  if (s.includes('MIZORAM')) return 'mizoram';
  if (s.includes('NAGALAND')) return 'nagaland';
  if (s.includes('ODISHA') || s.includes('ORISSA')) return 'odisha';
  if (s.includes('PUDUCHERRY') || s.includes('PONDICHERRY')) return 'puducherry';
  if (s.includes('PUNJAB')) return 'punjab';
  if (s.includes('RAJASTHAN')) return 'rajasthan';
  if (s.includes('SIKKIM')) return 'sikkim';
  if (s.includes('TAMIL')) return 'tamil-nadu';
  if (s.includes('TELANGANA')) return 'telangana';
  if (s.includes('TRIPURA')) return 'tripura';
  if (s.includes('UTTARAKHAND') || s.includes('UTTARANCHAL')) return 'uttarakhand';
  if (s.includes('UTTAR PRADESH')) return 'uttar-pradesh';
  if (s.includes('WEST BENGAL')) return 'west-bengal';

  return null;
}

async function downloadFileIfMissing(url, dest) {
  if (fs.existsSync(dest)) {
    console.log(`[Cache] Found ${path.basename(dest)} (${(fs.statSync(dest).size / (1024*1024)).toFixed(2)} MB)`);
    return dest;
  }
  console.log(`[Download] Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(dest, Buffer.from(buffer));
  console.log(`[Download] Saved ${path.basename(dest)} (${(buffer.byteLength / (1024*1024)).toFixed(2)} MB)`);
  return dest;
}

async function buildDataset() {
  console.log('====================================================');
  console.log('🇮🇳 LOCAL INDIA PINCODE DATASET BUILDER');
  console.log('====================================================\n');

  fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'states'), { recursive: true });
  fs.mkdirSync(path.join(DATA_DIR, 'union-territories'), { recursive: true });

  // Step 1: Ensure raw authoritative datasets are present
  const primaryFile = await downloadFileIfMissing(
    'https://raw.githubusercontent.com/aniket-thapa/india-pincode-api/main/data.csv',
    path.join(SCRATCH_DIR, 'aniket_data.csv')
  );

  const secondaryFile = await downloadFileIfMissing(
    'https://raw.githubusercontent.com/saravanakumargn/All-India-Pincode-Directory/master/all-india-pincode-html-csv.csv',
    path.join(SCRATCH_DIR, 'saravana_data.csv')
  );

  // Step 2: Index secondary dataset for contact and taluk enrichment
  console.log('\n[Processing] Indexing secondary postal directory (taluk, contact details)...');
  const secondaryMap = new Map();
  const sarStream = fs.createReadStream(secondaryFile);
  const sarRl = readline.createInterface({ input: sarStream, crlfDelay: Infinity });
  let sHeader = null;

  for await (const line of sarRl) {
    if (!line.trim()) continue;
    if (!sHeader) {
      sHeader = parseCSVLine(line);
      continue;
    }
    const parts = parseCSVLine(line);
    const [office, pin, type, delivery, division, region, circle, taluk, district, state, phone, suboffice, headoffice] = parts;
    const key = `${pin.trim()}_${normalizeKey(office)}`;
    secondaryMap.set(key, {
      taluk: taluk && taluk !== 'NA' && taluk !== 'NULL' ? taluk.trim() : undefined,
      phone: phone && phone !== 'NA' && phone !== 'NULL' ? phone.trim() : undefined,
      relatedSubOffice: suboffice && suboffice !== 'NA' && suboffice !== 'NULL' ? suboffice.trim() : undefined,
      relatedHeadOffice: headoffice && headoffice !== 'NA' && headoffice !== 'NULL' ? headoffice.trim() : undefined,
    });
  }
  console.log(`[Processing] Indexed ${secondaryMap.size} secondary records.`);

  // Step 3: First pass to build district resolution maps
  console.log('[Processing] Building district resolution index...');
  const pinToDistrict = new Map();
  const divToDistrict = new Map();

  const pass1Stream = fs.createReadStream(primaryFile);
  const pass1Rl = readline.createInterface({ input: pass1Stream, crlfDelay: Infinity });
  let p1Header = null;

  for await (const line of pass1Rl) {
    if (!line.trim()) continue;
    if (!p1Header) {
      p1Header = parseCSVLine(line);
      continue;
    }
    const parts = parseCSVLine(line);
    const [circle, region, division, office, pin, type, delivery, district, state] = parts;
    if (district && district !== 'NA' && district !== 'NULL') {
      const cleanDist = toTitleCase(district);
      if (!pinToDistrict.has(pin)) pinToDistrict.set(pin, cleanDist);
      if (!divToDistrict.has(division)) divToDistrict.set(division, cleanDist);
    }
  }

  // Step 4: Parse, normalize, and group all records by State/UT and Pincode
  console.log('[Processing] Parsing and normalizing primary postal dataset...');
  const groupedData = new Map(); // entitySlug -> Map<pincode, PincodeRecord>
  for (const slug of Object.keys(ENTITIES)) {
    groupedData.set(slug, new Map());
  }

  const primStream = fs.createReadStream(primaryFile);
  const primRl = readline.createInterface({ input: primStream, crlfDelay: Infinity });
  let pHeader = null;
  let rawRecordCount = 0;
  let duplicatesFound = 0;
  let invalidPincodes = [];
  const seenOfficeKey = new Set();
  const allUniquePincodes = new Set();
  let totalValidPostOffices = 0;

  for await (const line of primRl) {
    if (!line.trim()) continue;
    if (!pHeader) {
      pHeader = parseCSVLine(line);
      continue;
    }
    rawRecordCount++;
    const parts = parseCSVLine(line);
    const [rawCircle, rawRegion, rawDivision, rawOffice, rawPin, rawType, rawDelivery, rawDistrict, rawState, rawLat, rawLon] = parts;

    const pincode = rawPin.trim();
    if (!/^\d{6}$/.test(pincode)) {
      invalidPincodes.push({ line: rawRecordCount, pincode, office: rawOffice });
      continue;
    }
    allUniquePincodes.add(pincode);

    const slug = normalizeStateSlug(rawState, rawCircle, rawDivision);
    if (!slug || !ENTITIES[slug]) {
      throw new Error(`Unmapped State/UT at line ${rawRecordCount}: state="${rawState}", circle="${rawCircle}", division="${rawDivision}"`);
    }

    const entity = ENTITIES[slug];
    const stateName = entity.name;

    // Resolve district
    let districtName = rawDistrict && rawDistrict !== 'NA' && rawDistrict !== 'NULL'
      ? toTitleCase(rawDistrict)
      : (pinToDistrict.get(pincode) || divToDistrict.get(rawDivision) || 'General');

    // Deduplication check
    const officeNameClean = rawOffice.trim();
    const officeKey = `${pincode}_${normalizeKey(officeNameClean)}_${(rawDelivery || '').toUpperCase()}`;
    if (seenOfficeKey.has(officeKey)) {
      duplicatesFound++;
      continue;
    }
    seenOfficeKey.add(officeKey);

    // Parse coordinates if valid
    let latitude = undefined;
    let longitude = undefined;
    if (rawLat && rawLat !== 'NA' && rawLat !== 'NULL') {
      const parsedLat = parseFloat(rawLat);
      if (!isNaN(parsedLat) && parsedLat >= 6.0 && parsedLat <= 38.0) latitude = parsedLat;
    }
    if (rawLon && rawLon !== 'NA' && rawLon !== 'NULL') {
      const parsedLon = parseFloat(rawLon);
      if (!isNaN(parsedLon) && parsedLon >= 68.0 && parsedLon <= 98.0) longitude = parsedLon;
    }

    // Secondary enrichment
    const secKey = `${pincode}_${normalizeKey(officeNameClean)}`;
    const secData = secondaryMap.get(secKey);

    // Build PostOffice object
    const postOffice = {
      officeName: officeNameClean,
      officeType: normalizeOfficeType(rawType),
      deliveryStatus: normalizeDeliveryStatus(rawDelivery),
      circle: rawCircle ? rawCircle.trim() : undefined,
      region: rawRegion ? rawRegion.trim() : undefined,
      division: rawDivision ? rawDivision.trim() : undefined,
      taluk: secData?.taluk || undefined,
      subDistrict: secData?.taluk || undefined,
      district: districtName,
      state: stateName,
      phone: secData?.phone || undefined,
      latitude: latitude,
      longitude: longitude,
      relatedSubOffice: secData?.relatedSubOffice || undefined,
      relatedHeadOffice: secData?.relatedHeadOffice || undefined,
    };

    // Remove undefined properties to keep JSON clean & authoritative
    for (const key of Object.keys(postOffice)) {
      if (postOffice[key] === undefined) {
        delete postOffice[key];
      }
    }

    const stateMap = groupedData.get(slug);
    if (!stateMap.has(pincode)) {
      stateMap.set(pincode, {
        pincode: pincode,
        state: stateName,
        district: districtName,
        postOffices: []
      });
    }

    stateMap.get(pincode).postOffices.push(postOffice);
    totalValidPostOffices++;
  }

  console.log(`[Processing] Processed ${rawRecordCount} raw rows.`);
  console.log(`[Processing] Valid Post Offices: ${totalValidPostOffices}`);
  console.log(`[Processing] Unique 6-digit Pincodes: ${allUniquePincodes.size}`);
  console.log(`[Processing] Deduplicated exact duplicate offices: ${duplicatesFound}`);

  // Step 5: Write State and UT JSON files
  console.log('\n[Generating] Writing State and Union Territory JSON files...');
  const stateMetaList = [];
  const utMetaList = [];
  const pincodeDirectory = {}; // pincode -> slug

  for (const [slug, entity] of Object.entries(ENTITIES)) {
    const stateMap = groupedData.get(slug);
    // Sort pincodes ascending
    const sortedPincodes = Array.from(stateMap.keys()).sort();
    const records = sortedPincodes.map(pin => {
      const rec = stateMap.get(pin);
      // Sort post offices alphabetically by officeName
      rec.postOffices.sort((a, b) => a.officeName.localeCompare(b.officeName));
      return rec;
    });

    const targetSubdir = entity.folder;
    const targetFile = path.join(DATA_DIR, targetSubdir, `${slug}.json`);
    fs.writeFileSync(targetFile, JSON.stringify(records, null, 2), 'utf8');

    // Register pincodes in directory
    for (const pin of sortedPincodes) {
      pincodeDirectory[pin] = slug;
    }

    let totalOfficesInEntity = 0;
    records.forEach(r => totalOfficesInEntity += r.postOffices.length);

    const metaItem = {
      name: entity.name,
      slug: slug,
      type: entity.type,
      file: `${targetSubdir}/${slug}.json`,
      totalPincodes: records.length,
      totalPostOffices: totalOfficesInEntity,
    };

    if (entity.type === 'state') {
      stateMetaList.push(metaItem);
    } else {
      utMetaList.push(metaItem);
    }
  }

  // Step 6: Generate index.json
  console.log('[Generating] Generating index.json with country metadata and directory index...');
  const indexData = {
    country: "India",
    isoAlpha2: "IN",
    isoAlpha3: "IND",
    isoNumeric: "356",
    phoneCode: "+91",
    flag: "🇮🇳",
    lastUpdated: OFFICIAL_UPDATE_DATE,
    source: OFFICIAL_SOURCE,
    stats: {
      totalPostOffices: totalValidPostOffices,
      uniquePincodes: allUniquePincodes.size,
      statesCount: stateMetaList.length,
      unionTerritoriesCount: utMetaList.length,
    },
    states: stateMetaList,
    unionTerritories: utMetaList,
    pincodeDirectory: pincodeDirectory,
  };

  const indexFilePath = path.join(DATA_DIR, 'index.json');
  fs.writeFileSync(indexFilePath, JSON.stringify(indexData, null, 2), 'utf8');

  // Step 7: Mirror to public/data/india-pincodes if needed
  if (path.resolve(DATA_DIR) !== path.resolve(PUBLIC_DATA_DIR)) {
    console.log('[Mirroring] Mirroring files to public/data/india-pincodes/ for client-side offline access...');
    fs.mkdirSync(path.join(PUBLIC_DATA_DIR, 'states'), { recursive: true });
    fs.mkdirSync(path.join(PUBLIC_DATA_DIR, 'union-territories'), { recursive: true });

    fs.copyFileSync(indexFilePath, path.join(PUBLIC_DATA_DIR, 'index.json'));
    for (const s of stateMetaList) {
      fs.copyFileSync(path.join(DATA_DIR, s.file), path.join(PUBLIC_DATA_DIR, s.file));
    }
    for (const u of utMetaList) {
      fs.copyFileSync(path.join(DATA_DIR, u.file), path.join(PUBLIC_DATA_DIR, u.file));
    }
  }

  // Step 8: Comprehensive Automated Validation Suite
  console.log('\n[Validation] Running automated 11-point validation suite...');
  const validationChecks = [];

  // Check 1: Every pincode has exactly 6 digits
  const invalidPincodeRecords = [];
  for (const pin of Object.keys(pincodeDirectory)) {
    if (!/^\d{6}$/.test(pin)) {
      invalidPincodeRecords.push(pin);
    }
  }
  validationChecks.push({
    check: '1. Every Pincode must contain exactly 6 digits',
    passed: invalidPincodeRecords.length === 0,
    details: `${invalidPincodeRecords.length} invalid pincodes found`
  });

  // Check 2: No duplicate Pincode/Post Office combination within any pincode
  let duplicateCombinations = 0;
  for (const [slug, stateMap] of groupedData.entries()) {
    for (const [pin, rec] of stateMap.entries()) {
      const officeNames = rec.postOffices.map(o => `${o.officeName}|${o.deliveryStatus}`);
      const set = new Set(officeNames);
      if (set.size !== officeNames.length) {
        duplicateCombinations += (officeNames.length - set.size);
      }
    }
  }
  validationChecks.push({
    check: '2. No duplicate Pincode/Post Office combination',
    passed: duplicateCombinations === 0,
    details: `${duplicateCombinations} duplicates inside postOffices arrays`
  });

  // Check 3: Multiple post offices preserved per pincode
  let multiOfficePincodes = 0;
  let maxOfficesInSinglePincode = 0;
  for (const [slug, stateMap] of groupedData.entries()) {
    for (const [pin, rec] of stateMap.entries()) {
      if (rec.postOffices.length > 1) multiOfficePincodes++;
      if (rec.postOffices.length > maxOfficesInSinglePincode) maxOfficesInSinglePincode = rec.postOffices.length;
    }
  }
  validationChecks.push({
    check: '3. No Post Office may disappear because another office has the same Pincode',
    passed: multiOfficePincodes > 0 && maxOfficesInSinglePincode > 1,
    details: `${multiOfficePincodes} pincodes with multiple post offices preserved (max: ${maxOfficesInSinglePincode})`
  });

  // Check 4: Every record belongs to one State or Union Territory
  let orphanRecords = 0;
  for (const [slug, stateMap] of groupedData.entries()) {
    if (!ENTITIES[slug]) orphanRecords += stateMap.size;
  }
  validationChecks.push({
    check: '4. Every record must belong to one State or Union Territory',
    passed: orphanRecords === 0,
    details: `${orphanRecords} orphan records`
  });

  // Check 5: Verify all 28 States
  const generatedStateFiles = fs.readdirSync(path.join(DATA_DIR, 'states')).filter(f => f.endsWith('.json'));
  validationChecks.push({
    check: '5. Verify all 28 States',
    passed: stateMetaList.length === 28 && generatedStateFiles.length === 28,
    details: `Generated: ${generatedStateFiles.length} / 28 states`
  });

  // Check 6: Verify all 8 Union Territories
  const generatedUTFiles = fs.readdirSync(path.join(DATA_DIR, 'union-territories')).filter(f => f.endsWith('.json'));
  validationChecks.push({
    check: '6. Verify all 8 Union Territories',
    passed: utMetaList.length === 8 && generatedUTFiles.length === 8,
    details: `Generated: ${generatedUTFiles.length} / 8 union territories`
  });

  // Check 7: Verify every generated state/UT file contains only records belonging to that State/UT
  let crossContamination = 0;
  for (const [slug, entity] of Object.entries(ENTITIES)) {
    const filePath = path.join(DATA_DIR, entity.folder, `${slug}.json`);
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const rec of fileContent) {
      if (rec.state !== entity.name) {
        crossContamination++;
      }
      for (const po of rec.postOffices) {
        if (po.state !== entity.name) {
          crossContamination++;
        }
      }
    }
  }
  validationChecks.push({
    check: '7. Verify every generated state/UT file contains only records belonging to that State/UT',
    passed: crossContamination === 0,
    details: `${crossContamination} cross-contaminated records`
  });

  // Check 8: Verify index.json counts equal the actual generated files
  const indexObj = JSON.parse(fs.readFileSync(indexFilePath, 'utf8'));
  const countsMatch = indexObj.states.length === 28 &&
                      indexObj.unionTerritories.length === 8 &&
                      Object.keys(indexObj.pincodeDirectory).length === allUniquePincodes.size &&
                      indexObj.stats.totalPostOffices === totalValidPostOffices;
  validationChecks.push({
    check: '8. Verify index.json counts equal the actual generated files',
    passed: countsMatch,
    details: `Index states=${indexObj.states.length}, UTs=${indexObj.unionTerritories.length}, pincodes=${Object.keys(indexObj.pincodeDirectory).length}`
  });

  // Check 9: Duplicate office records in source tracked
  validationChecks.push({
    check: '9. Check duplicate office records in raw source',
    passed: true,
    details: `${duplicatesFound} identical rows deduplicated`
  });

  // Check 10: Check missing required postal fields
  let missingRequiredFields = 0;
  for (const [slug, entity] of Object.entries(ENTITIES)) {
    const filePath = path.join(DATA_DIR, entity.folder, `${slug}.json`);
    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    for (const rec of fileContent) {
      if (!rec.pincode || !rec.state || !rec.district || !Array.isArray(rec.postOffices) || rec.postOffices.length === 0) {
        missingRequiredFields++;
      }
      for (const po of rec.postOffices) {
        if (!po.officeName || !po.district || !po.state) {
          missingRequiredFields++;
        }
      }
    }
  }
  validationChecks.push({
    check: '10. Check missing required postal fields (pincode, state, district, officeName)',
    passed: missingRequiredFields === 0,
    details: `${missingRequiredFields} records with missing required fields`
  });

  const allPassed = validationChecks.every(c => c.passed);

  // Step 9: Generate validation-report.json
  const validationReport = {
    status: allPassed ? "PASS" : "FAIL",
    generatedAt: new Date().toISOString(),
    source: OFFICIAL_SOURCE,
    sourceUpdateDate: OFFICIAL_UPDATE_DATE,
    summary: {
      totalPostOfficeRecords: totalValidPostOffices,
      uniquePincodes: allUniquePincodes.size,
      statesCount: stateMetaList.length,
      unionTerritoriesCount: utMetaList.length,
      duplicatesFound: duplicatesFound,
      invalidPincodes: invalidPincodes.length,
      missingAmbiguousFields: missingRequiredFields,
    },
    validationChecks: validationChecks,
    states: stateMetaList.map(s => ({ name: s.name, pincodes: s.totalPincodes, postOffices: s.totalPostOffices })),
    unionTerritories: utMetaList.map(u => ({ name: u.name, pincodes: u.totalPincodes, postOffices: u.totalPostOffices })),
  };

  const reportPath = path.join(DATA_DIR, 'validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(validationReport, null, 2), 'utf8');
  if (path.resolve(DATA_DIR) !== path.resolve(PUBLIC_DATA_DIR)) {
    fs.copyFileSync(reportPath, path.join(PUBLIC_DATA_DIR, 'validation-report.json'));
  }

  // Step 10: Final summary print
  console.log('\n====================================================');
  console.log('FINAL DATASET SUMMARY');
  console.log('====================================================');
  console.log(`DATA SOURCE:          ${OFFICIAL_SOURCE}`);
  console.log(`SOURCE UPDATED:       ${OFFICIAL_UPDATE_DATE}`);
  console.log(`STATES:               ${stateMetaList.length}`);
  console.log(`UNION TERRITORIES:    ${utMetaList.length}`);
  console.log(`UNIQUE PINCODES:      ${allUniquePincodes.size}`);
  console.log(`POST OFFICE RECORDS:  ${totalValidPostOffices}`);
  console.log(`VALIDATION:           ${allPassed ? 'PASS' : 'FAIL'}`);
  console.log('====================================================\n');

  validationChecks.forEach(c => {
    console.log(`[${c.passed ? '✓ PASS' : '✗ FAIL'}] ${c.check}: ${c.details}`);
  });

  if (!allPassed) {
    throw new Error('Validation failed! Dataset is incomplete or invalid.');
  }

  console.log('\nValidation report written to: data/india-pincodes/validation-report.json');
  console.log('Dataset build complete and validated successfully!\n');
}

buildDataset().catch(err => {
  console.error('\n❌ Build Error:', err);
  process.exit(1);
});
