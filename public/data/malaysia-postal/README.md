# Malaysia Postal Code & Administrative Dataset (Data Poskod & Pentadbiran Malaysia)

An enterprise-grade, offline-first, production-ready local dataset and lookup engine for Malaysian 5-digit postcodes and administrative divisions. Built for high-reliability ERP and logistics systems.

---

## 1. Overview & ISO Metadata

- **Country**: Malaysia (Official: *Malaysia*)
- **Malay Name**: Malaysia
- **ISO Alpha-2**: `MY`
- **ISO Alpha-3**: `MYS`
- **ISO Numeric**: `458`
- **International Calling Code**: `+60`
- **Currency**: Malaysian Ringgit (`MYR`, `RM`)
- **Flag**: 🇲🇾
- **Postal Code Format**: Exactly 5 numeric digits (`^[0-9]{5}$`)
- **Postal Code Storage**: Strictly preserved as **string** to ensure leading zero protection (e.g. `"01000"`, `"05000"`).

---

## 2. Authoritative Data Sources

1. **Malaysian Communications and Multimedia Commission (MCMC)**:
   - Official Postal Directory and Poskod Allocation Standard.
   - Accessed via Malaysian Open Data Portal (`data.gov.my`).
2. **Department of Statistics Malaysia (DOSM / OpenDOSM)**:
   - Regional Classifications and Geodata (`state_district.csv`).
   - Official codes for all 160 administrative districts across 16 states and federal territories.
3. **Ministry of Health Malaysia (MoH)**:
   - Open Data Public Administrative Registry (`facilities_master.csv`).
   - Provides verified cross-correlations between Postcode, Bandar, Daerah, and Negeri.
4. **Universal Postal Union (UPU)**:
   - UPU S42 Postal Addressing Standard for Malaysia.

---

## 3. Administrative Architecture

Malaysia has a constitutionally defined administrative structure:
**13 States + 3 Federal Territories = 16 Top-Level Units**.

### 13 States (`administrativeType: "State"`)
1. **Johor** (`MY-01`, DOSM: `1`, Capital: Johor Bahru)
2. **Kedah** (`MY-02`, DOSM: `2`, Capital: Alor Setar)
3. **Kelantan** (`MY-03`, DOSM: `3`, Capital: Kota Bharu) — *Preserves Jajahan administrative subdivisions*
4. **Melaka** (`MY-04`, DOSM: `4`, Capital: Bandar Melaka)
5. **Negeri Sembilan** (`MY-05`, DOSM: `5`, Capital: Seremban)
6. **Pahang** (`MY-06`, DOSM: `6`, Capital: Kuantan)
7. **Pulau Pinang** (`MY-07`, DOSM: `7`, Capital: George Town)
8. **Perak** (`MY-08`, DOSM: `8`, Capital: Ipoh)
9. **Perlis** (`MY-09`, DOSM: `9`, Capital: Kangar)
10. **Selangor** (`MY-10`, DOSM: `10`, Capital: Shah Alam)
11. **Terengganu** (`MY-11`, DOSM: `11`, Capital: Kuala Terengganu)
12. **Sabah** (`MY-12`, DOSM: `12`, Capital: Kota Kinabalu) — *Preserves divisions & districts*
13. **Sarawak** (`MY-13`, DOSM: `13`, Capital: Kuching) — *Preserves divisions & sub-districts*

### 3 Federal Territories (`administrativeType: "Federal Territory"`)
1. **Wilayah Persekutuan Kuala Lumpur** (`MY-14`, DOSM: `14`) — Federal Capital
2. **Wilayah Persekutuan Labuan** (`MY-15`, DOSM: `15`) — International Offshore Financial Centre
3. **Wilayah Persekutuan Putrajaya** (`MY-16`, DOSM: `16`) — Federal Administrative Centre

---

## 4. Key Architectural Features

- **Zero Runtime External API Calls**: The ERP never makes external network requests when resolving postcodes. All lookups resolve locally against pre-partitioned JSON.
- **Leading-Zero Protection**: Preserves leading zeroes for states in northern Peninsular Malaysia (e.g. Perlis `01000`–`02800`, Kedah `05000`–`09810`).
- **Kelantan Jajahan Classification**: Accurately recognizes that Kelantan's district tier is designated as *Jajahan* (e.g. *Jajahan Kota Bharu*, *Jajahan Pasir Mas*).
- **Multi-Match Preservation**: Where a single postcode serves multiple towns or localities (e.g. `84300` Bukit Pasir / Muar, `86400` Batu Pahat / Parit Raja), both records are retained without overwrite.
- **In-Memory Caching**: State/territory files and lookup results are cached in memory for sub-microsecond performance (~3.6 µs per cached lookup).

---

## 5. File Layout

```
data/malaysia-postal/
├── index.json                        # Master index, metadata, top-level units, postcodeMap
├── validation-report.json            # Automated validation report (Status: PASS)
├── README.md                         # Documentation
├── states/                           # 13 State files
│   ├── johor.json
│   ├── kedah.json
│   ├── kelantan.json
│   ├── melaka.json
│   ├── negeri-sembilan.json
│   ├── pahang.json
│   ├── perak.json
│   ├── perlis.json
│   ├── pulau-pinang.json
│   ├── sabah.json
│   ├── sarawak.json
│   ├── selangor.json
│   └── terengganu.json
└── federal-territories/              # 3 Federal Territory files
    ├── kuala-lumpur.json
    ├── labuan.json
    └── putrajaya.json
```

---

## 6. Offline Lookup API

```typescript
import { lookupMalaysiaPostcode } from './lookup';

// Single match
const res1 = await lookupMalaysiaPostcode('43000');
console.log(res1.primaryMatch?.administrativeArea.nameEn); // "Selangor"
console.log(res1.primaryMatch?.district.nameEn);           // "Hulu Langat"
console.log(res1.primaryMatch?.city.nameEn);               // "Kajang"

// Multiple matches (e.g. 84300)
const res2 = await lookupMalaysiaPostcode('84300');
console.log(res2.matches.map(m => m.city.nameEn));         // ["Bukit Pasir", "Muar"]
```
