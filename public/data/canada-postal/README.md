# Canada Postal Code & Address Master Dataset (Postes Canada & Statistique Canada)

## 1. Overview
This dataset provides a complete, production-ready, 100% offline, local Canadian postal code and administrative address master for ERP SaaS applications.

- **Country**: Canada (Canada)
- **Flag**: 🇨🇦
- **ISO 3166-1 Alpha-2**: `CA`
- **ISO 3166-1 Alpha-3**: `CAN`
- **ISO 3166-1 Numeric**: `124`
- **Calling Code**: `+1`
- **Postal Code Type**: Alphanumeric (6 characters excluding space)
- **Canonical Display Format**: `ANA NAN` (e.g., `K1A 0B1`)
- **Normalized Format**: `ANANAN` (e.g., `K1A0B1`)

---

## 2. Authoritative Data Sources
1. **Canada Post Corporation (Société canadienne des postes)**
   - Authority for Postal Code Structure, Forward Sortation Areas (FSA), Local Delivery Units (LDU), and delivery conventions.
   - Character restrictions: The letters **D, F, I, O, Q, and U** are never used in Canadian postal codes; **W and Z** are never used as the first letter of an FSA.
   - Second FSA character: `0` denotes Rural postal areas, `1–9` denotes Urban postal areas.
2. **Statistics Canada (Statistique Canada)**
   - Authority for Standard Geographical Classification (SGC 2021).
   - 10 Provinces & 3 Territories (SGC codes 10 to 62).
   - Census Divisions (CD) and Census Subdivisions (CSD).

---

## 3. Administrative Structure (10 Provinces & 3 Territories = 13 Divisions)

### 10 Provinces
| Province Name (EN) | Nom (FR) | Code | ISO | SGC Code | FSA Prefixes |
|---|---|---|---|---|---|
| Newfoundland and Labrador | Terre-Neuve-et-Labrador | `NL` | `CA-NL` | `10` | `A` |
| Prince Edward Island | Île-du-Prince-Édouard | `PE` | `CA-PE` | `11` | `C` |
| Nova Scotia | Nouvelle-Écosse | `NS` | `CA-NS` | `12` | `B` |
| New Brunswick | Nouveau-Brunswick | `NB` | `CA-NB` | `13` | `E` |
| Quebec | Québec | `QC` | `CA-QC` | `24` | `G`, `H`, `J` |
| Ontario | Ontario | `ON` | `CA-ON` | `35` | `K`, `L`, `M`, `N`, `P` |
| Manitoba | Manitoba | `MB` | `CA-MB` | `46` | `R` |
| Saskatchewan | Saskatchewan | `SK` | `CA-SK` | `47` | `S` |
| Alberta | Alberta | `AB` | `CA-AB` | `48` | `T` |
| British Columbia | Colombie-Britannique | `BC` | `CA-BC` | `59` | `V` |

### 3 Territories
| Territory Name (EN) | Nom (FR) | Code | ISO | SGC Code | FSA Prefixes |
|---|---|---|---|---|---|
| Yukon | Yukon | `YT` | `CA-YT` | `60` | `Y` |
| Northwest Territories | Territoires du Nord-Ouest | `NT` | `CA-NT` | `61` | `X` (`X0E`, `X0G`, `X1A`) |
| Nunavut | Nunavut | `NU` | `CA-NU` | `62` | `X` (`X0A`, `X0B`, `X0C`) |

*Note: The official name is **Yukon**, not "Yukon Territory".*

---

## 4. Postal Geography vs. Municipal Geography vs. Census Geography
Canadian address architecture strictly separates:
- **Postal Geography**: `postalCity`, `postalMunicipality`, `fsa`, `ldu`.
- **Municipal Geography**: Official municipal incorporation units (`censusSubdivision`).
- **Census Geography**: `censusDivision` (Counties, Regional Districts, Single-tier municipalities) and `censusSubdivision` (CSD).

Neither replaces the other; all classifications are preserved.

---

## 5. File Structure
```text
data/canada-postal/
├── index.json                             # Master metadata, summary statistics, fast postcodeMap
├── validation-report.json                 # Complete audit report verifying all 22 rules
├── lookup.ts                              # Isomorphic offline resolution engine
├── README.md                              # Technical documentation
├── provinces/
│   ├── newfoundland-and-labrador.json
│   ├── prince-edward-island.json
│   ├── nova-scotia.json
│   ├── new-brunswick.json
│   ├── quebec.json
│   ├── ontario.json
│   ├── manitoba.json
│   ├── saskatchewan.json
│   ├── alberta.json
│   └── british-columbia.json
└── territories/
    ├── yukon.json
    ├── northwest-territories.json
    └── nunavut.json
```

---

## 6. Runtime Offline Verification
Run the verification test suite:
```bash
pnpm run test-canada-postal
```
All lookups execute locally with zero runtime network or external API dependencies.
