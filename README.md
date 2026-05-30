# Compta Dashboard

Personal finance management — track accounts, investments, properties, and loans with live data.

## Quick Start

**Windows:** Double-click `START_COMPTA.bat`

**PowerShell:**
```powershell
. .\launch_app.ps1
```

Dashboard opens at: http://localhost:5173

## Features

- 💰 Multi-currency accounts (EUR, SGD, GBP, USD, etc.)
- 📈 Investment portfolio tracking
- 🏠 Property & loan management  
- 📊 Real-time FX exposure
- 🔄 Auto-refresh with market data
- 💾 Local SQLite database

## API Docs

Backend API: http://127.0.0.1:8000/docs

## Setup (First Time)

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python init_db.py
```

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
