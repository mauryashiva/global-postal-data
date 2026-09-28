# Complete Local China Postal Code & Administrative Dataset (中国邮政编码与行政区划数据库)

Authoritative, 100% offline, production-ready local JSON dataset covering all **34 Province-Level Administrative Divisions**, **Prefecture Cities**, **Districts/Counties**, and **6-digit Postal Codes** of the People's Republic of China.

**Zero External API Calls**: All postal lookups execute locally from pre-built, validated JSON files with sub-millisecond in-memory caching.

---

## Dataset Metrics & Classification

- **ISO Standards**: ISO 3166-1 `CN` / `CHN` / `156`, Phone Code: `+86`, Flag: 🇨🇳
- **Postal Code Format**: Strictly 6 numeric digits (`^[0-9]{6}$`)
- **Authoritative Sources**:
  1. Ministry of Civil Affairs (MCA) & National Bureau of Statistics (NBS) standard **GB/T 2260**
  2. State Post Bureau of the PRC / China Post Group
  3. Universal Postal Union (UPU) S42 Addressing Standard for China
  4. GeoNames China Postal Geographic Database (cross-referenced coordinates)
- **Province-Level Divisions**: **34**
  - **23 Provinces** (`provinces/`)
  - **5 Autonomous Regions** (`autonomous-regions/`)
  - **4 Municipalities Directly Under Central Govt** (`municipalities/`)
  - **2 Special Administrative Regions** (`special-administrative-regions/`)
- **Unique 6-digit Postal Codes**: 2,904
- **Total Administrative Records**: 3,172
- **Validation Status**: **PASS** (14/14 automated audit rules verified in `validation-report.json`)

---

## Directory Layout

```
data/china-postal/ (and public/data/china-postal/)
│
├── index.json                  # Country metadata, 34 division stats, postalCodeDirectory index
├── validation-report.json      # 14-point enterprise audit report
├── lookup.ts                   # Universal TypeScript lookup engine with in-memory caching
├── README.md                   # This documentation
│
├── provinces/                  # 23 Provinces (administrativeType: "Province")
│   ├── anhui.json
│   ├── fujian.json
│   ├── gansu.json
│   ├── guangdong.json
│   ├── guizhou.json
│   ├── hainan.json
│   ├── hebei.json
│   ├── heilongjiang.json
│   ├── henan.json
│   ├── hubei.json
│   ├── hunan.json
│   ├── jiangsu.json
│   ├── jiangxi.json
│   ├── jilin.json
│   ├── liaoning.json
│   ├── qinghai.json
│   ├── shaanxi.json
│   ├── shandong.json
│   ├── shanxi.json
│   ├── sichuan.json
│   ├── taiwan.json
│   ├── yunnan.json
│   └── zhejiang.json
│
├── autonomous-regions/         # 5 Autonomous Regions (administrativeType: "Autonomous Region")
│   ├── guangxi.json
│   ├── inner-mongolia.json
│   ├── ningxia.json
│   ├── tibet.json
│   └── xinjiang.json
│
├── municipalities/             # 4 Direct Municipalities (administrativeType: "Municipality")
│   ├── beijing.json
│   ├── chongqing.json
│   ├── shanghai.json
│   └── tianjin.json
│
└── special-administrative-regions/ # 2 SARs (administrativeType: "Special Administrative Region")
    ├── hong-kong.json
    └── macao.json
```

---

## ERP Field Naming & Internal Model

### User-Friendly UI Names vs Official Internal Hierarchy
The UI displays clear, international standard ERP field names:
* **Country**: China (中国)
* **Province / Region**: e.g., Guangdong (广东省)
* **City**: e.g., Shenzhen (深圳市)
* **Prefecture / County**: e.g., Nanshan District (南山区)
* **Postal Code**: e.g., `518000`
* **Post Office / Locality**: e.g., Nanshan Delivery Office
* **Address**: Building, Street, Room Number

### Internal Bilingual Data Model
Every record preserves official administrative types, English, Chinese characters, and Pinyin:

```json
{
  "postalCode": "518000",
  "matches": [
    {
      "country": "China",
      "provinceRegion": {
        "nameEn": "Guangdong",
        "nameZh": "广东省",
        "namePinyin": "Guǎngdōng Shěng",
        "administrativeType": "Province",
        "code": "440000"
      },
      "city": {
        "nameEn": "Shenzhen",
        "nameZh": "深圳市",
        "namePinyin": "Shēnzhèn Shì",
        "administrativeType": "Prefecture-level City",
        "code": "440300"
      },
      "prefectureCounty": {
        "nameEn": "Nan Shan District",
        "nameZh": "南山区",
        "namePinyin": "Nan Shan",
        "administrativeType": "District",
        "code": "440305"
      },
      "locality": {
        "nameEn": "Nan Shan District Central",
        "nameZh": "南山区投递局",
        "namePinyin": "Nan Shan Tóudìjú"
      },
      "postOffice": {
        "nameEn": "Nan Shan District Post Office",
        "nameZh": "南山区邮政支局",
        "namePinyin": "Nan Shan Yóuzhèng Zhījú",
        "type": "Branch Post Office",
        "code": "518000"
      },
      "latitude": 22.5431,
      "longitude": 114.0579,
      "source": {
        "name": "China National Bureau of Statistics GB/T 2260 & China Post",
        "recordId": "CN-440305"
      }
    }
  ]
}
```

---

## Quick Usage in ERP

```typescript
import {
  lookupChinaPostalCode,
  populateChinaAddressFields,
  validateChinaPostalCode
} from './lookup';

// 1. Validate
if (validateChinaPostalCode('518000')) {
  // 2. Offline lookup
  const res = await lookupChinaPostalCode('518000');
  if (res.found) {
    // If multiple districts share this code, let user choose:
    const selectedMatch = res.matches[0];
    
    // 3. Format ERP address
    const address = populateChinaAddressFields(selectedMatch, '518000', {
      addressLine1: 'Room 1204, Tower B, Kexing Science Park',
      addressLine2: 'Keyuan Road, Yuehai Subdistrict'
    });
    
    console.log(address.provinceRegion); // "Guangdong (广东省)"
    console.log(address.city);           // "Shenzhen (深圳市)"
    console.log(address.prefectureCounty); // "Nan Shan District (南山区)"
  }
}
```

---

## Re-building / Updating Dataset

To fetch the latest official tables and rebuild:

```bash
node scripts/update-china-postal-data.mjs
node scripts/test-china-lookup.mjs
```
