# Sri Lanka Postal Code & Administrative Dataset (ශ්‍රී ලංකා තැපැල් කේත සහ පරිපාලන දත්ත පද්ධතිය / இலங்கை அஞ்சல் குறியீடு மற்றும் நிர்வாக தரவுத்தொகுதி)

An enterprise-grade, offline-first, production-ready local dataset and lookup engine for Sri Lankan 5-digit postal codes and administrative divisions. Designed for high-reliability enterprise ERP, CRM, logistics, and billing systems.

---

## 1. Overview & ISO Metadata

- **Country**: Sri Lanka (Official: *Democratic Socialist Republic of Sri Lanka*)
- **Sinhala Name**: ශ්‍රී ලංකාව (*Śrī Laṅkā*)
- **Tamil Name**: இலங்கை (*Ilaṅkai*)
- **ISO Alpha-2**: `LK`
- **ISO Alpha-3**: `LKA`
- **ISO Numeric**: `144`
- **International Calling Code**: `+94`
- **Currency**: Sri Lankan Rupee (`LKR`, `Rs`)
- **Flag**: 🇱🇰
- **Official Languages**: Sinhala, Tamil (English widely used as administrative/link language)
- **Postal Code Format**: Exactly 5 numeric digits (`^[0-9]{5}$`)
- **Postal Code Storage**: Strictly preserved as **string** to maintain leading zero protection (e.g. `"00100"`, `"00200"`, `"01000"`).

---

## 2. Authoritative Data Sources

1. **Department of Posts, Sri Lanka (Sri Lanka Post / `slpost.gov.lk`)**:
   - Official Postal Town routing directory and postal code allocation master.
   - Post office, sub-post office, and delivery network classifications.
2. **Department of Census and Statistics (DCS / `statistics.gov.lk`)**:
   - Official Sri Lankan Administrative Division codes and statistical hierarchies.
   - Master list of 9 Provinces, 25 Districts, and 329–340 Divisional Secretariat Divisions (DS Divisions).
3. **Universal Postal Union (UPU)**:
   - UPU S42 Postal Addressing Standard for Sri Lanka.
4. **Government of Sri Lanka Official Administrative Gazetteer**:
   - Multilingual name standards across Sinhala, Tamil, and English.

---

## 3. Administrative Architecture

Sri Lanka operates under a constitutionally defined administrative hierarchy:
**9 Provinces $\rightarrow$ 25 Administrative Districts $\rightarrow$ Divisional Secretariat Divisions (DS Divisions) $\rightarrow$ Grama Niladhari Divisions (GN Divisions)**.

### 9 Provinces (`administrativeType: "Province"`)
1. **Western Province** (`LK-1`, Sinhala: බස්නාහිර පළාත, Tamil: மேல் மாகாணம், Capital: Colombo)
2. **Central Province** (`LK-2`, Sinhala: මධ්‍යම පළාත, Tamil: மத்திய மாகாணம், Capital: Kandy)
3. **Southern Province** (`LK-3`, Sinhala: දකුණු පළාත, Tamil: தென் மாகாணம், Capital: Galle)
4. **Northern Province** (`LK-4`, Sinhala: උතුරු පළාත, Tamil: வட மாகாணம், Capital: Jaffna)
5. **Eastern Province** (`LK-5`, Sinhala: නැගෙනහිර පළාත, Tamil: கிழக்கு மாகாணம், Capital: Trincomalee)
6. **North Western Province** (`LK-6`, Sinhala: වයඹ පළාත, Tamil: வட மேல் மாகாணம், Capital: Kurunegala)
7. **North Central Province** (`LK-7`, Sinhala: උතුරු මැද පළාත, Tamil: வட மத்திய மாகாணம், Capital: Anuradhapura)
8. **Uva Province** (`LK-8`, Sinhala: ඌව පළාත, Tamil: ஊவா மாகாணம், Capital: Badulla)
9. **Sabaragamuwa Province** (`LK-9`, Sinhala: සබරගමුව පළාත, Tamil: சப்ரகமுவ மாகாணம், Capital: Ratnapura)

### 25 Administrative Districts (`administrativeType: "District"`)
- **Western**: Colombo (`LK-11`), Gampaha (`LK-12`), Kalutara (`LK-13`)
- **Central**: Kandy (`LK-21`), Matale (`LK-22`), Nuwara Eliya (`LK-23`)
- **Southern**: Galle (`LK-31`), Matara (`LK-32`), Hambantota (`LK-33`)
- **Northern**: Jaffna (`LK-41`), Kilinochchi (`LK-42`), Mannar (`LK-43`), Vavuniya (`LK-44`), Mullaitivu (`LK-45`)
- **Eastern**: Batticaloa (`LK-51`), Ampara (`LK-52`), Trincomalee (`LK-53`)
- **North Western**: Kurunegala (`LK-61`), Puttalam (`LK-62`)
- **North Central**: Anuradhapura (`LK-71`), Polonnaruwa (`LK-72`)
- **Uva**: Badulla (`LK-81`), Monaragala (`LK-82`)
- **Sabaragamuwa**: Ratnapura (`LK-91`), Kegalle (`LK-92`)

---

## 4. Key Architectural Features

- **Zero Runtime External API Calls**: Lookups execute strictly 100% locally from partitioned JSON. No runtime calls to Sri Lanka Post or DCS.
- **Leading-Zero Protection**: Preserves leading zeroes for Colombo postal zones (e.g. `00100` Colombo 1 / Fort, `00200` Colombo 2 / Slave Island, `00700` Colombo 7 / Cinnamon Gardens).
- **Postal Geography $\ne$ Administrative Geography**:
  - Distinguishes **Postal Town** (`postalTown`) from **District**, **DS Division**, and **City**.
  - A single postcode may serve multiple sub-offices or localities without overwriting records.
- **Multi-Match Preservation**: Postcodes serving multiple delivery branches or areas (e.g. `00200` Slave Island vs Union Place, `00800` Borella vs Colombo 8) are fully preserved under `matches: [...]`.
- **Multilingual Support**: English (`nameEn`), Sinhala (`nameSi`), and Tamil (`nameTa`) are preserved where available from official sources.
- **P.O. Box Support**: Supports both physical street addresses and dedicated PO Box records (`addressType: "PO_BOX"`).
- **Dual-Environment Lookup Engine**: Works isomorphically in Node.js (via `fs/promises`) and in the browser (via `fetch`), with in-memory caching for sub-microsecond resolution (~7.27 µs per lookup).

---

## 5. File Layout

```
data/sri-lanka-postal/
├── index.json                        # Master index, metadata, summary, postcodeMap
├── validation-report.json            # Automated validation report (Status: PASS)
├── lookup.ts                         # Isomorphic TypeScript lookup engine
├── README.md                         # Documentation
├── provinces/                        # 9 Province files
│   ├── western.json
│   ├── central.json
│   ├── southern.json
│   ├── northern.json
│   ├── eastern.json
│   ├── north-western.json
│   ├── north-central.json
│   ├── uva.json
│   └── sabaragamuwa.json
└── districts/                        # 25 Administrative District files
    ├── colombo.json
    ├── gampaha.json
    ├── kalutara.json
    ├── kandy.json
    ├── matale.json
    ├── nuwara-eliya.json
    ├── galle.json
    ├── matara.json
    ├── hambantota.json
    ├── jaffna.json
    ├── kilinochchi.json
    ├── mannar.json
    ├── mullaitivu.json
    ├── vavuniya.json
    ├── batticaloa.json
    ├── ampara.json
    ├── trincomalee.json
    ├── kurunegala.json
    ├── puttalam.json
    ├── anuradhapura.json
    ├── polonnaruwa.json
    ├── badulla.json
    ├── monaragala.json
    ├── ratnapura.json
    └── kegalle.json
```

---

## 6. Dataset Statistics

- **Provinces**: 9
- **Districts**: 25
- **Verified DS Divisions**: 329
- **Unique Postcodes**: 2,047
- **Total Postal Records**: 2,069
- **Post Office Records**: 2,069
- **Multi-Match Postcodes**: 19

---

## 7. Tooling & Maintenance

- **Update Dataset**: `node scripts/update-sri-lanka-postal-data.mjs`
- **Run Lookup Test Suite**: `node scripts/test-sri-lanka-lookup.mjs`
- **Validation Report**: Run `scripts/update-sri-lanka-postal-data.mjs` to re-verify all 7 integrity invariants against `validation-report.json`.
