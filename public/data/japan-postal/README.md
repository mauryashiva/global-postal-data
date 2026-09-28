# Japan Postal Code & Administrative Dataset (日本郵便番号・行政区画データセット)

## 1. Overview
Enterprise-grade, 100% offline local postal code and administrative dataset for Japan, adhering strictly to official Japan Post Co., Ltd. (日本郵便株式会社) and Ministry of Internal Affairs and Communications (総務省) standards.

- **Country**: Japan (日本国)
- **ISO Codes**: JP / JPN / 392
- **Calling Code**: +81
- **Currency**: JPY (¥)
- **Postal Code Format**: `XXX-XXXX` (7 numeric digits, strictly stringified to preserve leading zeros)

## 2. Authoritative Sources
- **Japan Post Co., Ltd. (日本郵便株式会社)**: 住所の郵便番号 (UTF-8 Master Dataset)
- **Japan Post Individual Business Postal Codes (大口事業所個別番号データ)**
- **Ministry of Internal Affairs and Communications (総務省)**: Local Government Administrative Hierarchy & JIS X 0401/0402
- **Source Updated**: 2026-08-31
- **Retrieved**: 2026-09-28

## 3. Administrative Geography Hierarchy
Japan's official administrative divisions are preserved without artificial flattening:
- **47 Prefectures (都道府県)**:
  - 1 To (都): Tokyo (東京都)
  - 1 Do (道): Hokkaido (北海道)
  - 2 Fu (府): Kyoto (京都府), Osaka (大阪府)
  - 43 Ken (県)
- **Municipalities (市区町村 / 郡)**:
  - Special Wards (特別区 - e.g. Chiyoda-ku, Shinjuku-ku, Minato-ku)
  - Ordinance-designated Cities (政令指定都市 - e.g. Osaka City, Sapporo City) with administrative wards (区)
  - Core Cities (中核市) & General Cities (市)
  - Counties (郡 - Gun) containing Towns (町 - Machi/Cho) and Villages (村 - Mura/Son)
- **Towns & Areas (町域・丁目・大字)**

## 4. Key Distinctions
- **Area vs Business Codes**: Normal geographic town-area postal codes vs Individual Large-User Business Codes (`大口事業所個別番号`).
- **Flags Preserved**: `multiplePostalCodesForTownArea`, `smallAreaNumbering`, `hasChome`, `postalCodeCoversMultipleTownAreas`.
- **Special Values Preserved**: "以下に掲載がない場合", "市町村の次に番地がくる場合", "市町村一円".

## 5. Offline Runtime Operation
Zero external API calls at runtime. Lookups execute in-memory with O(1) prefix-partition routing and LRU caching.
