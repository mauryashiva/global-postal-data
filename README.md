# 🌍 Global Postal Data

**Local Postal Intelligence & Address Autofill Engine**

Global Postal Data is a free, developer-friendly collection of **country-specific postal and administrative datasets**, designed for applications that need fast and reliable postal-code lookups without depending on a live postal API at runtime.

> **Built because existing public datasets are often general-purpose, differently structured, or require developers to combine and adapt multiple sources. Global Postal Data brings country-specific postal data into a consistent, developer-friendly project while preserving each country's actual postal structure.**

🌐 **Live Demo:** [global-postal-data.onrender.com](https://global-postal-data.onrender.com)

---

## ✨ Why Global Postal Data?

There are already great public projects for countries, cities, postal codes, and geodata, including:

- [srestre/world-countries-cities-db](https://github.com/srestre/world-countries-cities-db)
- [Zippopotam.us](https://www.zippopotam.us/)
- [GeoNames](https://www.geonames.org/)
- [zauberware/postal-codes-json-xml-csv](https://github.com/zauberware/postal-codes-json-xml-csv)
- [symerio/postal-codes-data](https://github.com/symerio/postal-codes-data)

These projects are useful for general-purpose applications. However, postal systems vary widely from country to country. Global Postal Data focuses on:

- **Country-specific postal structures** and naming conventions
- **Administrative hierarchies** (Provinces, States, Districts, Taluks, Municipalities)
- **Official postal code formats** with offline regex validators
- **Post office branches and local delivery areas** where available
- **Structured JSON datasets** designed for microsecond runtime performance
- **100% offline lookup** with zero runtime API dependency

The goal is simple: **Make postal data easier to find, understand, integrate, and use.**

---

## 🌎 Supported Countries (13)

| Country | Flag | ISO Alpha-2 | ISO Alpha-3 | Numeric | Calling Code | Dataset Directory |
|---|:---:|:---:|:---:|:---:|:---:|---|
| **India** | 🇮🇳 | `IN` | `IND` | `356` | `+91` | `public/data/india-pincodes/` |
| **China** | 🇨🇳 | `CN` | `CHN` | `156` | `+86` | `public/data/china-postal/` |
| **United States** | 🇺🇸 | `US` | `USA` | `840` | `+1` | `public/data/usa-postal/` |
| **United Kingdom** | 🇬🇧 | `GB` | `GBR` | `826` | `+44` | `public/data/uk-postcodes/` |
| **Japan** | 🇯🇵 | `JP` | `JPN` | `392` | `+81` | `public/data/japan-postal/` |
| **Canada** | 🇨🇦 | `CA` | `CAN` | `124` | `+1` | `public/data/canada-postal/` |
| **South Korea** | 🇰🇷 | `KR` | `KOR` | `410` | `+82` | `public/data/south-korea-postal/` |
| **Indonesia** | 🇮🇩 | `ID` | `IDN` | `360` | `+62` | `public/data/indonesia-postal/` |
| **Malaysia** | 🇲🇾 | `MY` | `MYS` | `458` | `+60` | `public/data/malaysia-postal/` |
| **Vietnam** | 🇻🇳 | `VN` | `VNM` | `704` | `+84` | `public/data/vietnam-postal/` |
| **Sri Lanka** | 🇱🇰 | `LK` | `LKA` | `144` | `+94` | `public/data/sri-lanka-postal/` |
| **Egypt** | 🇪🇬 | `EG` | `EGY` | `818` | `+20` | `public/data/egypt-postal/` |
| **Afghanistan** | 🇦🇫 | `AF` | `AFG` | `004` | `+93` | `public/data/afghanistan-postal/` |

*More countries will be added over time.*

---

## 🚀 What It Provides

- 🌍 **Multi-country coverage**: 13 countries with unified data interfaces.
- 📮 **Instant postal-code lookup**: Sub-millisecond offline lookups.
- 📍 **Area & locality details**: Neighborhoods, colonies, villages, and special zones.
- 🏢 **Post office branches**: Specific delivery offices, classifications, and contact info where available.
- 🗺️ **Administrative divisions**: Accurate state, province, district, and sub-district hierarchies.
- 🌐 **Country-specific postal formats**: Built-in format validation and cleaners.
- 📴 **100% Offline runtime**: All datasets stored locally as optimized JSON files.
- 🚫 **Zero API dependency**: No rate limits, API keys, or external network requests.
- 📦 **Developer-friendly JSON**: Easy to ingest into databases, ERPs, or mobile apps.
- 🔄 **Dataset update scripts**: Automated scripts to keep datasets fresh.

---

## 📁 Data Structure

All country datasets are located inside:

```text
public/data/
├── india-pincodes/
├── china-postal/
├── usa-postal/
├── uk-postcodes/
├── japan-postal/
├── canada-postal/
├── south-korea-postal/
├── indonesia-postal/
├── malaysia-postal/
├── vietnam-postal/
├── sri-lanka-postal/
├── egypt-postal/
└── afghanistan-postal/
```

Each country dataset follows a systematic structure tailored to that country's administrative and postal system.

---

## ⚡ How It Works

```text
Select Country
      ↓
Enter Postal Code
      ↓
Query Local Offline Dataset (in public/data/)
      ↓
Match Postal Records & Available Areas
      ↓
Select Post Office Branch & Area / Neighborhood
      ↓
Auto-Populate City, District, State & Address Form
```

- Lookups execute entirely in the browser or on your local server.
- No external HTTP requests are made at runtime.

---

## 🛠️ Built With

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Static Export)
- **UI & Logic**: React 19, TypeScript
- **Styling**: Tailwind CSS (Dark/Light mode support)
- **Data**: Static JSON datasets partitioned for fast local lookups

---

## 💻 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/mauryashiva/global-postal-data.git
cd global-postal-data
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install
```

### 3. Start the development server

```bash
pnpm dev
# or
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Built For

Global Postal Data can be used as a foundation for:

- **E-Commerce Checkout**: Instant autofill of billing and shipping addresses.
- **ERP & CRM Systems**: Accurate customer master data creation with validated postal codes.
- **Logistics & Delivery**: Route planning, branch identification, and address standardization.
- **International Applications**: Single interface across multiple global postal systems.
- **Offline / Air-Gapped Environments**: Applications running without external internet access.

---

## 📌 Data Source & Attribution

Datasets are researched, structured, and maintained country-by-country using authoritative national postal sources, open data directories, and official administrative divisions.

Because postal boundaries and administrative units change periodically, always verify critical production shipments against the relevant country's official postal authority when necessary.

---

## 🤝 Contributions

Contributions, corrections, updates, and new country support are very welcome!

If you find incorrect postal information or want to add support for a new country:
1. Fork the repository
2. Create your branch (`git checkout -b feature/new-country`)
3. Commit your changes (`git commit -m 'Add support for Country'`)
4. Push to the branch (`git push origin feature/new-country`)
5. Open a Pull Request

---

## 📄 License

This project is open-source. License information will be updated as the project develops.
