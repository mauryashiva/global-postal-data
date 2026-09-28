# Complete Local India Pincode Dataset & Offline ERP Lookup

Authoritative, 100% offline, local JSON postal dataset covering every Indian State, Union Territory, 6-digit Pincode, and Post Office.

**Zero External API Calls**: All lookups run locally from pre-built, validated JSON files.

---

## Dataset Metrics

- **Official Source**: Department of Posts, Ministry of Communications, Government of India
- **Source Updated**: September 2026 (`2026-09-09`)
- **Total Post Offices**: 165,595
- **Unique 6-digit Pincodes**: 19,586
- **States Covered**: 28
- **Union Territories Covered**: 8 (including unified *Dadra and Nagar Haveli and Daman and Diu*, and *Ladakh*)
- **Validation Status**: **PASS** (10/10 automated audit rules verified in `validation-report.json`)

---

## Directory Layout

```
data/india-pincodes/
│
├── index.json                  # Country metadata, state/UT stats, pincode->slug directory index
├── localities.json             # Extensible sub-localities/neighborhoods per PIN (e.g. 401209)
├── validation-report.json      # Complete automated 11-point audit report
├── lookup.ts                   # Universal TypeScript lookup engine with in-memory LRU caching
├── update-dataset.mjs          # Reusable automated update, normalization, and validation tool
├── test-lookup.mjs             # Test runner for local lookups
├── README.md                   # This documentation
│
├── states/                     # 28 Indian States (1 JSON per state)
│   ├── andhra-pradesh.json
│   ├── arunachal-pradesh.json
│   ├── assam.json
│   ├── bihar.json
│   ├── chhattisgarh.json
│   ├── goa.json
│   ├── gujarat.json
│   ├── haryana.json
│   ├── himachal-pradesh.json
│   ├── jharkhand.json
│   ├── karnataka.json
│   ├── kerala.json
│   ├── madhya-pradesh.json
│   ├── maharashtra.json
│   ├── manipur.json
│   ├── meghalaya.json
│   ├── mizoram.json
│   ├── nagaland.json
│   ├── odisha.json
│   ├── punjab.json
│   ├── rajasthan.json
│   ├── sikkim.json
│   ├── tamil-nadu.json
│   ├── telangana.json
│   ├── tripura.json
│   ├── uttar-pradesh.json
│   ├── uttarakhand.json
│   └── west-bengal.json
│
└── union-territories/          # 8 Union Territories
    ├── andaman-and-nicobar-islands.json
    ├── chandigarh.json
    ├── dadra-and-nagar-haveli-and-daman-and-diu.json
    ├── delhi.json
    ├── jammu-and-kashmir.json
    ├── ladakh.json
    ├── lakshadweep.json
    └── puducherry.json
```

---

## Quick Usage in ERP

### 1. Import Lookup Functions

```typescript
import { lookupPincode, populateAddressFields, validatePincode } from './lookup';
// Or from Next.js alias:
// import { lookupPincode, populateAddressFields } from '@/lib/pincode-lookup';
```

### 2. Lookup When User Enters a 6-digit Pincode

```typescript
async function onPincodeChange(pincode: string) {
  if (!validatePincode(pincode)) {
    return; // Wait until 6 digits are typed
  }

  const result = await lookupPincode(pincode);

  if (!result.found) {
    alert(result.error);
    return;
  }

  // If multiple post offices exist, present a dropdown/select list to user:
  if (result.postOffices.length > 1) {
    showPostOfficeDropdown(result.postOffices);
  } else {
    // Single post office match:
    const address = populateAddressFields(result.postOffices[0], pincode);
    applyAddressToForm(address);
  }
}

function onSelectPostOffice(selectedOffice, pincode) {
  const address = populateAddressFields(selectedOffice, pincode);

  // Populates standard ERP address fields:
  // address.pincode          -> "400001"
  // address.postOffice       -> "Mumbai GPO"
  // address.cityTown         -> "Mumbai"
  // address.district         -> "Mumbai"
  // address.talukSubDistrict -> "Mumbai"
  // address.stateUT          -> "Maharashtra"
  // address.country          -> "India"
  // address.officeType       -> "Head Office"
  // address.deliveryStatus   -> "Delivery"
  // address.phone            -> "022-22620693"
  // address.latitude         -> 18.9391667
  // address.longitude        -> 72.8375556
}
```

---

## Micro-Neighborhoods & Sub-Localities (`localities.json`)

### Why Do Some Post Offices Deliver to Multiple Distinct Areas?
In India's postal system:
- **Rural Areas**: Multiple Branch Offices (`B.O.`) map to individual villages under one PIN.
- **Urban / Semi-Urban Areas**: A single Sub Office (`S.O.`) like `Nallosapare E S.O` (`401209`) is responsible for delivering to dozens of neighborhoods, colonies, and nagars (e.g., *Nalasopara East, Gokhivra, Dhaniv, Achole, Damodar Nagar, Kargil Nagar*).
- **Official Government Data Scope**: The Department of Posts publishes records down to the Post Office, Taluk, and District level. It does **not** maintain a centralized digital registry of all 15,000,000+ local housing societies, mohallas, and colonies across India.
- **The Solution**: An optional, extensible `localities.json` mapping file. When a user enters `401209`, `lookupPincode` automatically detects the covered neighborhoods and returns them in `result.areas`.

```typescript
const result = await lookupPincode('401209');
console.log(result.areas);
// -> ["Nalasopara East", "Gokhivra", "Dhaniv", "Achole", "Damodar Nagar", "Kargil Nagar"]

// Populate address for a specific neighborhood:
const address = populateAddressFields(result.postOffices[0], '401209', 'India', 'Damodar Nagar');
console.log(address.area); // "Damodar Nagar"
console.log(address.district); // "Palghar"
```

---

## Performance & Offline Architecture

1. **Lazy State-level Loading**: `index.json` (~500 KB uncompressed, ~50 KB gzipped) maps all 19,586 pincodes to their corresponding State/UT file. The browser or server never loads the full 165,595 records at once.
2. **In-Memory Cache**: Once a State/UT JSON file is fetched (e.g., `maharashtra.json`), it is stored in an in-memory `Map`. Subsequent lookups for that state execute in **0.02ms**.
3. **100% Offline Capability**: Since files are also mirrored to `public/data/india-pincodes/`, web apps function completely offline as PWAs or local intranet deployments.

---

## Dataset Update Command

To download latest monthly data, clean, enrich, split, and re-verify:

```bash
pnpm run update-pincodes
# OR
node data/india-pincodes/update-dataset.mjs
```
