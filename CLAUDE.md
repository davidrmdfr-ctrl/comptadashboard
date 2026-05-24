# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Personal Finance Assistant** — A secure, local-first web application replacing Compta.xlsx. Tracks multi-currency accounts, real estate portfolio with detailed amortization, investment holdings, tax planning, and financial forecasting. Built with Python (FastAPI), SQLite with encryption, and a modern web frontend.

### Core Features (Migrated from Compta.xlsx)
- **Multi-Currency Cash Accounts** — EUR, SGD, GBP, HKD, USD, JPY, AUD with live exchange rates
- **Investment Portfolio** — Stocks, ETFs tracked with current market prices and yields
- **Real Estate Properties** — Detailed tracking per property (Roses, Wagner, Parmentier, Boulets, Larmor Plage)
  - Amortization schedules
  - Rental income & expenses
  - Net equity calculation
  - Capital left / value tracking
- **Tax Planning** — Income, deductions, tax calculations, gains/losses
- **Financial Forecasting** — Multi-year projections based on market assumptions
- **Monthly Asset Value Snapshots** — Total portfolio value trend analysis
- **Secure Data Storage** — Encrypted SQLite database, local-first with optional cloud backup
- **Excel Export** — Continue using Excel for reports/analysis (data syncs both directions)

---

## Architecture

### High-Level Design
```
┌─────────────────────────────────────────────┐
│   Web Frontend (React/Vue + TailwindCSS)   │
│   - Portfolio dashboard                     │
│   - Market data refresh (on-demand)         │
│   - Monthly asset value input/tracking      │
│   - Tax & forecasting views                 │
└────────────────┬────────────────────────────┘
                 │ REST API (JSON)
┌────────────────▼────────────────────────────┐
│   FastAPI Backend (Python)                  │
│   - Portfolio management                    │
│   - Market data fetcher (async)             │
│   - Tax calculations                        │
│   - Forecasting engine                      │
│   - Authentication (local dev, OAuth cloud) │
└────────────────┬────────────────────────────┘
                 │ SQL
┌────────────────▼────────────────────────────┐
│   SQLite + SQLCipher (Encrypted Database)   │
│   - /Data/portfolio.db (encrypted)          │
│   - Stored in fixed path (cannot move)      │
└─────────────────────────────────────────────┘
```

### Data Security Model
1. **At Rest**: SQLite encrypted with SQLCipher (AES-256 by default)
2. **In Transit**: HTTPS/TLS (if cloud-deployed)
3. **Secrets Management**: `.env` file for API keys, database password (never in repo)
4. **Local Storage**: Optional full-disk encryption (BitLocker/FileVault)
5. **Cloud Backup** (optional): Encrypted snapshots, not live sync — keep authoritative copy local
6. **Data Path**: Fixed location `/Data/portfolio.db` — non-negotiable, cannot be shared

### Database Schema (Conceptual)
Core tables migrated from Compta.xlsx:

**Assets & Accounts**
- `cash_accounts` — currency, amount, exchange_rate_to_eur, last_updated
- `investments` — symbol, type (stock/ETF/bond), quantity, cost_basis, acquisition_date, current_price, ccy
- `properties` — name, location, initial_value, current_value, currency, type (rental/primary/investment)

**Real Estate (Per Property)**
- `property_amortization` — property_id, month, capital_left, interest_paid, principal_paid, amortization_rate, duration
- `property_cashflow` — property_id, month, gross_income, expenses, net_income, value_t1
- `property_equity` — property_id, month, net_equity, real_net_equity

**Financial Data**
- `monthly_snapshots` — date, total_assets_eur, total_debt_eur, net_equity_eur, cash_breakdown
- `tax_data` — year, income, deductions, taxable_income, tax_paid, gains_losses
- `forecasts` — projection_date, months_ahead, assumptions (yield, inflation, etc.), projected_value

**Market Data**
- `market_prices` — symbol, price, ccy, date, source (yfinance, etc.)

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Backend | FastAPI (Python 3.10+) | Async, type-safe, built-in OpenAPI docs |
| Database | SQLite + SQLCipher | Local-first, encrypted, zero setup |
| Frontend | React/Vue + TailwindCSS | Modern, reactive, simple styling |
| Secrets | python-dotenv | Load `.env` for API keys, DB password |
| Async Tasks | APScheduler or Celery | Market data refresh scheduling (if needed) |
| Testing | pytest | Unit + integration tests |
| Deployment | Docker (optional) | Cloud deployment with Gunicorn |

---

## Project Structure

```
personal-assistant/
├── CLAUDE.md                    # This file
├── README.md                    # User-facing setup & usage
├── .env.example                 # Template for secrets & DB password
├── .gitignore                   # Never commit .env, __pycache__, .db, Data/
├── requirements.txt             # Python dependencies
│
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Settings (DB path, exchange rates, etc.)
│   ├── database.py              # SQLCipher connection & session mgmt
│   │
│   ├── models/                  # Pydantic API schemas (request/response)
│   │   ├── account.py           # CashAccount, Investment schemas
│   │   ├── property.py          # Property, Amortization schemas
│   │   ├── snapshot.py          # Monthly snapshot schema
│   │   └── tax.py               # Tax data schema
│   │
│   ├── db/                      # SQLAlchemy ORM models
│   │   ├── models.py            # All table definitions
│   │   └── migrations.py        # Schema updates (if needed)
│   │
│   ├── routes/                  # API endpoints (RESTful)
│   │   ├── accounts.py          # GET/POST cash accounts, exchange rates
│   │   ├── investments.py       # GET/POST/UPDATE investments
│   │   ├── properties.py        # GET/POST/UPDATE properties & amortization
│   │   ├── snapshots.py         # POST/GET monthly asset value snapshots
│   │   ├── market.py            # Refresh prices (on-demand)
│   │   ├── tax.py               # Tax calculations & reports
│   │   └── forecast.py          # Multi-year projections
│   │
│   ├── services/                # Business logic
│   │   ├── market_fetcher.py    # Fetch prices from yfinance, CoinGecko
│   │   ├── currency_converter.py# Exchange rate updates
│   │   ├── property_calculator.py # Amortization, rental income, equity
│   │   ├── tax_calculator.py    # Tax calculations
│   │   ├── forecast_engine.py   # Financial projections
│   │   └── excel_importer.py    # Import from Compta.xlsx (data migration)
│   │
│   ├── migrations/              # Excel to DB migration scripts
│   │   ├── import_compta.py     # One-time: import Compta.xlsx → DB
│   │   └── export_excel.py      # Export: DB → Excel (optional)
│   │
│   └── tests/
│       ├── test_accounts.py
│       ├── test_properties.py
│       ├── test_market.py
│       └── test_tax.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main app shell
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Overview of all assets
│   │   │   ├── Accounts.jsx     # Cash accounts by currency
│   │   │   ├── Investments.jsx  # Stock/ETF portfolio
│   │   │   ├── Properties.jsx   # Real estate details & amortization
│   │   │   ├── Tax.jsx          # Tax report
│   │   │   └── Forecast.jsx     # Financial projections
│   │   ├── components/
│   │   │   ├── AccountForm.jsx  # Add/edit cash account
│   │   │   ├── InvestmentForm.jsx
│   │   │   ├── PropertyForm.jsx
│   │   │   ├── SnapshotRecorder.jsx # Record monthly total value
│   │   │   └── MarketRefresh.jsx    # Refresh prices button
│   │   ├── services/
│   │   │   └── api.js           # HTTP client for backend
│   │   └── styles/
│   │       └── tailwind.config.js
│   └── package.json
│
└── Data/
    └── portfolio.db             # Encrypted SQLite DB (IMMUTABLE PATH)
    └── Compta.xlsx              # Original file (for reference/export)
```

---

## Development Setup

### Prerequisites
- Python 3.10+
- Node.js 16+ (frontend)
- pip, npm

### Backend Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database password and API keys

# Run database initialization (creates encrypted DB)
python backend/init_db.py

# Start development server
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm start  # Runs on http://localhost:3000
```

### Running Tests
```bash
# Backend unit tests
pytest backend/tests -v

# Single test file
pytest backend/tests/test_assets.py -v

# With coverage
pytest backend/tests --cov=backend
```

### Database Encryption
The database is encrypted at creation. The password is in `.env` (DATABASE_PASSWORD):
```python
# Stored in config.py or database.py
import sqlcipher3
sqlcipher3.register_adapter(...)
db = sqlcipher3.connect('Data/portfolio.db')
db.execute(f"PRAGMA key = '{DB_PASSWORD}'")
```

---

## Deployment

### Local (Development)
- Backend: `uvicorn` (built-in dev server)
- Frontend: npm dev server
- Database: Local encrypted SQLite

### Cloud (Optional)
- **Option 1: Cloud Storage + Local Compute**
  - Run FastAPI on cloud VM (AWS EC2, GCP Compute, etc.)
  - Database stays encrypted at rest on cloud
  - Frontend served from cloud (or self-hosted static)
  - Use HTTPS/TLS in transit

- **Option 2: Serverless (AWS Lambda, Google Cloud Functions)**
  - Requires cloud database (RDS Postgres with encryption, or DynamoDB)
  - Cold start latency acceptable for finance app
  - Automatic scaling

**Recommendation**: Start local + cloud backup. Migrate to cloud compute if needed.

---

## Key Decision Points

### Market Data Sources
Free APIs without authentication:
- **yfinance** — Stocks, ETFs, crypto (recommended, simple)
- **Alpha Vantage** — Stocks (free tier, rate-limited)
- **CoinGecko** — Crypto (no auth needed)

On-demand refresh via UI button (no background jobs initially).

### Monthly Asset Value Tracking
- Manual input (user clicks "Record Snapshot" button with date/value)
- Stores in `monthly_snapshots` table
- Used for trend analysis and forecasting accuracy

### Tax Calculations
- Track cost basis per asset
- Calculate realized gains/losses on sales
- Support wash-sale rules (optional, phase 2)

### Forecasting
- Linear regression or simple growth model
- Assume historical return rate + volatility
- Show confidence intervals

---

## Important Notes for Future Development

1. **Data Path is Immutable**: `/Data/portfolio.db` cannot move or be shared. Never refactor this path — it's fixed per your requirements.
2. **No Unencrypted Copies**: All data at rest must be encrypted with SQLCipher. No plaintext exports without encryption.
3. **Excel Migration**: Compta.xlsx is your **source of truth during transition**. The import script must validate data integrity (totals, dates, calculations match).
4. **Monthly Snapshots**: Users record monthly total asset value manually (via UI button). This replaces the "Historique projection" sheet — data flows one direction (UI → DB).
5. **Property Amortization**: Each property has its own calculation sheet (Roses, Wagner, etc.). The app recalculates these monthly based on principal/interest schedules.
6. **Exchange Rates**: Live rates pulled on-demand (yfinance). Stored locally to avoid repeated API calls.
7. **Environment Variables**: All secrets (DB password, API keys) in `.env`, never hardcoded.
8. **Testing**: Mock external APIs (yfinance, CoinGecko) in tests; don't hit production during test runs.
9. **Git Safety**: Add `Data/`, `.env`, `*.db`, and `Compta.xlsx` to `.gitignore` (sensitive financial data).
10. **Backward Compatibility** (Optional): Can export back to Excel format for reporting, but primary data lives in DB.

---

## Common Commands

```bash
# Start local development
make dev              # Backend + frontend (if Makefile exists)

# Or manually:
uvicorn backend.main:app --reload     # Terminal 1
cd frontend && npm start               # Terminal 2

# Run tests
make test             # All tests
pytest -k "asset"     # Filter by test name

# Database
python backend/init_db.py             # Initialize encrypted DB
python backend/migrate_db.py           # Run migrations (if schema changes)

# Format & lint
black backend/                         # Format Python
flake8 backend/ --max-line-length=100 # Lint

# Build for production
npm run build         # Frontend
docker build .        # Backend (if using Docker)
```

---

## Migration Strategy (Excel → Web App)

**Phase 1: Data Import** (High Priority)
1. Build `excel_importer.py` to parse Compta.xlsx
2. Map Excel sheets to database tables:
   - Overview → cash_accounts, investments, properties
   - Individual property sheets → property_amortization, property_cashflow
   - Tax sheet → tax_data
   - Historique projection → monthly_snapshots (historical)
3. One-time import script: reads Compta.xlsx, populates encrypted DB
4. Validate: row counts, totals match

**Phase 2: Core Features** (Weekly Snapshots)
1. Dashboard showing total asset value (EUR)
2. Snapshot recorder (monthly button to save current total)
3. Account/investment listing pages
4. Property detail pages with amortization view

**Phase 3: Real-time Updates** (On-Demand)
1. Market price refresh (yfinance + CoinGecko)
2. Exchange rate updates
3. Property value/income recalculation

**Phase 4: Advanced** (Optional)
1. Tax report generation
2. Financial forecasting
3. Excel export (keep workflow backwards-compatible)

## Next Steps

1. Initialize git repo: `git init`
2. Copy `.env.example` → `.env`, fill in database password
3. Set up Python virtual environment
4. Install dependencies from requirements.txt
5. Create database schema (SQLAlchemy models)
6. Build import script from Compta.xlsx → DB (critical path!)
7. Implement API endpoints for viewing data
8. Build frontend dashboard
9. Test end-to-end import + display
10. Deploy (local or cloud)
