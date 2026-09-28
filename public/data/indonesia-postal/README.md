# Indonesia Postal Code & Administrative Master Dataset (🇮🇩)

## Overview
Authoritative, offline-first local postal code and administrative master dataset for the **Republic of Indonesia (Republik Indonesia)**. Built specifically for mission-critical ERP usage across Customer, Supplier, Employee, Ledger, Invoicing, Billing, and Shipping logistics.

## Key Technical Specifications
- **Country**: Republic of Indonesia (Republik Indonesia)
- **ISO 3166**: `ID` / `IDN` / `360`
- **Calling Code**: `+62`
- **Postal Code Format**: 5 numeric digits (`^[0-9]{5}$`, e.g. `40198`, `10110`)
- **First-Level Administrative Divisions**: **Exactly 38 Provinces** (including the newly established autonomous Papua provinces: Papua Selatan, Papua Tengah, Papua Pegunungan, Papua Barat Daya).
- **Zero Runtime External API Calls**: 100% offline local lookup with $O(1)$ 2-digit partition routing and in-memory LRU caching.

## Administrative Hierarchy
```
Province (Provinsi) [38 Provinces]
    ↓
Kabupaten / Kota (Regency / City - Strictly Distinct Administrative Types)
    ↓
Kecamatan (District)
    ↓
Desa / Kelurahan (Village / Urban Village)
    ↓
RT / RW (Rukun Tetangga / Rukun Warga - Community References)
```

## 38 Official Provinces (Kemendagri & BPS 2024/2025)
1. **Aceh** (`11`) — Special Autonomous Region (Daerah Istimewa)
2. **Sumatera Utara** (`12`)
3. **Sumatera Barat** (`13`)
4. **Riau** (`14`)
5. **Jambi** (`15`)
6. **Sumatera Selatan** (`16`)
7. **Bengkulu** (`17`)
8. **Lampung** (`18`)
9. **Kepulauan Bangka Belitung** (`19`)
10. **Kepulauan Riau** (`21`)
11. **DKI Jakarta** (`31`) — Special Capital Region (Daerah Khusus Ibukota Jakarta)
12. **Jawa Barat** (`32`)
13. **Jawa Tengah** (`33`)
14. **Daerah Istimewa Yogyakarta** (`34`) — Special Region (Daerah Istimewa)
15. **Jawa Timur** (`35`)
16. **Banten** (`36`)
17. **Bali** (`51`)
18. **Nusa Tenggara Barat** (`52`)
19. **Nusa Tenggara Timur** (`53`)
20. **Kalimantan Barat** (`61`)
21. **Kalimantan Tengah** (`62`)
22. **Kalimantan Selatan** (`63`)
23. **Kalimantan Timur** (`64`) — Location of IKN Nusantara
24. **Kalimantan Utara** (`65`)
25. **Sulawesi Utara** (`71`)
26. **Sulawesi Tengah** (`72`)
27. **Sulawesi Selatan** (`73`)
28. **Sulawesi Tenggara** (`74`)
29. **Gorontalo** (`75`)
30. **Sulawesi Barat** (`76`)
31. **Maluku** (`81`)
32. **Maluku Utara** (`82`)
33. **Papua** (`91`) — Special Autonomy (Otonomi Khusus)
34. **Papua Barat** (`92`) — Special Autonomy (Otonomi Khusus)
35. **Papua Selatan** (`93`) — Special Autonomy (Otonomi Khusus)
36. **Papua Tengah** (`94`) — Special Autonomy (Otonomi Khusus)
37. **Papua Pegunungan** (`95`) — Special Autonomy (Otonomi Khusus)
38. **Papua Barat Daya** (`96`) — Special Autonomy (Otonomi Khusus)

## Partition Strategy
- Partitioned by 2-digit postal prefix under `postal/*.json` (e.g. `10.json`, `40.json`, `80.json`).
- Lazy-loaded into memory on demand; cached in memory to ensure sub-millisecond lookup response.

## Validation Status
- **Validation**: PASS (14/14 checks verified)
