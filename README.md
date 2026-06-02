# Personal Finance Assistant

A secure, private web application for managing your financial portfolio. Replaces the Excel spreadsheet with a modern app to track cash accounts, investments, real estate properties, and forecasting.

## What It Does

- **Cash Accounts** — Track money in different currencies (EUR, SGD, GBP, USD, HKD, JPY, AUD)
- **Investments** — Monitor stocks, ETFs with live market prices
- **Real Estate** — Manage properties (Roses, Wagner, Parmentier, Boulets, Larmor Plage) with amortization schedules
- **Asset Tracking** — Record your total portfolio value monthly to see growth trends
- **Tax Planning** — Track gains, losses, and tax obligations
- **Forecasting** — Project your wealth over multiple years

---

## Quick Start

### 1. First Time Setup

```bash
# Activate Python environment
cd "Personal Assistant\compta"
.\venv\Scripts\Activate.ps1

# Copy environment file
copy .env.example .env

# Edit .env with database password (ask Claude if unsure)
notepad .env

# Create the database
python init_db.py
```

### 2. Run the Application

Open **two terminal windows** and run these commands:

**Terminal 1 - Backend Server:**
```bash
# Make sure you're in "Personal Assistant\compta" directory
# Make sure venv is activated
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd "Personal Assistant\compta\frontend"
npm install  # (first time only)
npm start
```

Then open your browser: **http://localhost:3000**

---

## How to Use

### Adding a Cash Account
1. Go to **Accounts** page
2. Click **Add Account**
3. Enter currency and amount
4. Click Save

### Recording Monthly Portfolio Value
1. Go to **Dashboard**
2. Click **Record Snapshot**
3. Enter today's date and total portfolio value
4. Click Save (this tracks trends)

### Viewing Investment Prices
1. Go to **Investments** page
2. Click **Refresh Prices** to update from market
3. Current prices shown for each stock/ETF

### Property Details
1. Go to **Properties** page
2. Click on property name
3. View amortization schedule and rental income

---

## Important Rules

✅ **Your data is encrypted** — Stored securely on your computer
✅ **Never share `.env` file** — Contains database password
✅ **Data/ folder is private** — Never goes to GitHub
✅ **Keep snapshots monthly** — Record your total portfolio value each month
❌ **Don't move `Data/portfolio.db`** — Must stay in Data folder

---

## File Structure

```
├── backend/           # Python API (FastAPI)
├── frontend/          # Web interface (React)
├── Data/             # Your encrypted financial data
│   ├── portfolio.db  # Database (encrypted)
│   └── Compta.xlsx   # Original Excel file
├── .env              # Passwords (never commit)
└── init_db.py        # Setup script
```

---

## Troubleshooting

### "Port 8000 or 3000 already in use"
Close other applications using these ports, or change them in `.env`

### Database won't create
- Check `.env` file exists
- Make sure you have write permission to Data folder
- Try deleting `Data/portfolio.db` and run `python init_db.py` again

### Frontend won't load
- Check backend is running (Terminal 1)
- Open browser console (F12 → Console tab) to see errors
- Restart both servers

### Data looks wrong
- Import from Compta.xlsx first (ask Claude)
- Check latest snapshot date is correct

---

## Need Help?

- **Setup questions** → Check `.claude/init.md`
- **Technical details** → See `CLAUDE.md`
- **Ask Claude** → For features, fixes, or how to use

---

## Technologies

- **Backend**: Python + FastAPI (modern, fast API)
- **Database**: SQLite + encryption (secure, no setup)
- **Frontend**: React (interactive web interface)
- **Market Data**: yfinance (free stock prices)
