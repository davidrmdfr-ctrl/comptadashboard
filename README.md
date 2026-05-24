# Personal Finance Assistant

A secure, local-first web application for investment management, real estate portfolio tracking, tax planning, and financial forecasting. Replaces Compta.xlsx with an encrypted database backend.

## Features

- **Multi-currency accounts** — EUR, SGD, GBP, HKD, USD, JPY, AUD
- **Investment portfolio** — Stocks, ETFs, bonds with live market prices
- **Real estate management** — 5+ properties with amortization schedules and rental income tracking
- **Tax planning** — Annual tax calculations and deductions
- **Financial forecasting** — Multi-year projections
- **Secure storage** — SQLite + SQLCipher encryption at rest
- **Local-first** — Data stays on your machine, optional cloud backup

## Quick Start

### 1. Set up Python environment

```bash
# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Initialize database

```bash
python init_db.py
```

This will:
- Create `.env` with a secure database password
- Initialize the encrypted database
- Import data from Compta.xlsx

### 3. Run the backend

```bash
uvicorn backend.main:app --reload
```

The API will be available at `http://localhost:8000`

View the interactive API docs at: `http://localhost:8000/docs`

### 4. (Optional) Run the frontend

```bash
cd frontend
npm install
npm start
```

The web interface will be available at `http://localhost:3000`

## Project Structure

```
personal-assistant/
├── backend/                    # FastAPI backend
│   ├── db/models.py          # Database models
│   ├── main.py               # API entry point
│   ├── config.py             # Settings
│   └── migrations/           # Data import scripts
├── frontend/                 # React web UI (coming soon)
├── Data/
│   ├── portfolio.db          # Encrypted database (auto-created)
│   └── Compta.xlsx           # Original spreadsheet
├── init_db.py               # Database initialization script
├── CLAUDE.md               # Development guide
└── README.md               # This file
```

## Data Security

- **Encryption at rest**: SQLite + SQLCipher (AES-256)
- **Password protection**: Stored in `.env` (never committed)
- **Local-first**: Data on your machine by default
- **No sharing**: Data cannot be shared or moved
- **Immutable path**: Database at `./Data/portfolio.db`

## Development

See [CLAUDE.md](CLAUDE.md) for detailed architecture, database schema, and development guidelines.

### Running tests

```bash
pytest backend/tests -v
```

### Database operations

```bash
# Initialize (first time)
python init_db.py

# Manual import (if needed)
python -m backend.migrations.import_compta

# View database (using sqlite3)
sqlite3 Data/portfolio.db
```

## API Endpoints (Coming Soon)

### Accounts
- `GET /api/accounts/` — List cash accounts
- `POST /api/accounts/` — Create account
- `GET /api/accounts/{id}` — Get account details

### Investments
- `GET /api/investments/` — List investments
- `POST /api/investments/` — Add investment
- `GET /api/investments/{id}` — Get investment details

### Properties
- `GET /api/properties/` — List properties
- `GET /api/properties/{id}` — Get property with amortization
- `POST /api/properties/{id}/snapshots` — Record monthly value

### Market Data
- `POST /api/market/refresh` — Update prices from external sources

### Snapshots
- `POST /api/snapshots/` — Record monthly total asset value
- `GET /api/snapshots/` — Get snapshot history

### Tax
- `GET /api/tax/{year}` — Get tax data for year
- `POST /api/tax/{year}` — Update tax data

## Troubleshooting

### "Module not found" errors
Make sure the virtual environment is activated and dependencies are installed:
```bash
pip install -r requirements.txt
```

### Database errors
Delete `Data/portfolio.db` and run `python init_db.py` again:
```bash
rm Data/portfolio.db
python init_db.py
```

### Import failed
Check that Compta.xlsx is in the `Data/` folder and run:
```bash
python init_db.py
```

## Next Steps

1. ✓ Set up project structure
2. ✓ Create database schema
3. ✓ Import Compta.xlsx data
4. Build API endpoints (accounts, investments, properties)
5. Build frontend dashboard
6. Add real-time market data updates
7. Add forecasting features

## License

Private personal finance application. Do not share.

## Support

For development questions, see [CLAUDE.md](CLAUDE.md)
