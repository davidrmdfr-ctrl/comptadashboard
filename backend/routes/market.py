"""
Market data API routes.

Endpoints for fetching and refreshing market prices and exchange rates.
"""

import logging
from datetime import datetime, date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db import MarketData, CashAccount, Investment
from backend.models.market import (
    PriceRefreshRequest,
    PriceRefreshResponse,
    ExchangeRateRefreshRequest,
    ExchangeRateRefreshResponse,
    MarketDataResponse,
)
from backend.services.market_fetcher import MarketFetcher

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/refresh-prices", response_model=PriceRefreshResponse)
async def refresh_prices(
    request: PriceRefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Fetch and refresh prices for given symbols.

    Example:
    ```json
    {
      "symbols": ["DBS.SI", "HSBC.HK"],
      "refresh_type": "stock"
    }
    ```
    """
    logger.info(f"Refreshing prices for {len(request.symbols)} symbols: {request.symbols}")

    prices_fetched = 0
    prices_stored = 0
    investments_updated = 0
    results = {}

    if not request.symbols:
        logger.warning("No symbols provided for refresh")
        return PriceRefreshResponse(
            success=False,
            message="No symbols to refresh",
            prices_fetched=0,
            prices_stored=0,
            data={},
        )

    # Fetch prices
    if request.refresh_type in ("stock", "all"):
        for symbol in request.symbols:
            logger.info(f"Processing symbol: {symbol}")
            price = MarketFetcher.fetch_stock_price(symbol)
            if price is not None:
                prices_fetched += 1
                results[symbol] = price

                # Store in MarketData table
                market_data = MarketData(
                    symbol=symbol,
                    price=price,
                    currency="USD",  # Assume USD for now, could be expanded
                    date=date.today(),
                    source="yfinance",
                )
                db.add(market_data)
                prices_stored += 1

                # Update Investment table with new price
                try:
                    investments = db.query(Investment).filter(Investment.symbol == symbol).all()
                    for inv in investments:
                        inv.current_price = price
                        inv.eur_amount = inv.quantity * price  # Recalculate EUR value
                        investments_updated += 1
                except Exception as e:
                    logger.error(f"Error updating investment {symbol}: {e}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error storing prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing prices: {e}")

    message = f"Fetched {prices_fetched} prices, stored {prices_stored}, updated {investments_updated} investments"
    logger.info(message)

    return PriceRefreshResponse(
        success=prices_stored > 0 or investments_updated > 0,
        message=message,
        prices_fetched=prices_fetched,
        prices_stored=prices_stored,
        data=results,
    )


@router.post("/refresh-exchange-rates", response_model=ExchangeRateRefreshResponse)
async def refresh_exchange_rates(
    request: ExchangeRateRefreshRequest,
    db: Session = Depends(get_db),
):
    """
    Fetch and refresh exchange rates for given currencies.

    Example:
    ```json
    {
      "currencies": ["SGD", "GBP", "USD", "HKD"],
      "target_currency": "EUR"
    }
    ```
    """
    logger.info(f"Refreshing exchange rates for {request.currencies} to {request.target_currency}")

    rates_fetched = 0
    rates_updated = 0
    results = {}

    # Fetch rates
    for currency in request.currencies:
        if currency == request.target_currency:
            # 1:1 rate for same currency
            rate = 1.0
        else:
            rate = MarketFetcher.fetch_exchange_rate(currency, request.target_currency)

        if rate is not None:
            rates_fetched += 1
            results[currency] = rate

            # Update cash accounts with new exchange rate
            try:
                accounts = db.query(CashAccount).filter(CashAccount.currency == currency).all()
                for account in accounts:
                    account.exchange_rate = rate
                    account.eur_amount = account.amount * rate  # Recalculate EUR amount
                rates_updated += len(accounts)
            except Exception as e:
                logger.error(f"Error updating accounts for {currency}: {e}")

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating exchange rates: {e}")
        raise HTTPException(status_code=500, detail=f"Error updating rates: {e}")

    message = f"Fetched {rates_fetched} rates, updated {rates_updated} accounts"
    logger.info(message)

    return ExchangeRateRefreshResponse(
        success=rates_fetched > 0,
        message=message,
        rates_fetched=rates_fetched,
        rates_updated=rates_updated,
        data=results,
    )


@router.get("/exchange-rates/{currency}")
async def get_exchange_rate(
    currency: str,
    db: Session = Depends(get_db),
):
    """
    Get the latest stored exchange rate for a currency to EUR.

    Example: GET /api/market/exchange-rates/SGD
    """
    account = db.query(CashAccount).filter(CashAccount.currency == currency).first()

    if not account:
        raise HTTPException(status_code=404, detail=f"Currency {currency} not found")

    return {
        "currency": currency,
        "target_currency": "EUR",
        "rate": account.exchange_rate,
        "last_updated": account.last_updated,
    }


@router.get("/latest-price/{symbol}")
async def get_latest_price(
    symbol: str,
    db: Session = Depends(get_db),
):
    """
    Get the latest stored price for a symbol.

    Example: GET /api/market/latest-price/DBS.SI
    """
    market_data = (
        db.query(MarketData)
        .filter(MarketData.symbol == symbol)
        .order_by(MarketData.date.desc())
        .first()
    )

    if not market_data:
        raise HTTPException(status_code=404, detail=f"No price data for {symbol}")

    return {
        "symbol": symbol,
        "price": market_data.price,
        "currency": market_data.currency,
        "date": market_data.date,
        "source": market_data.source,
    }


@router.get("/market-data")
async def list_market_data(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List all stored market data with pagination.

    Example: GET /api/market/market-data?skip=0&limit=50
    """
    data = db.query(MarketData).offset(skip).limit(limit).all()
    total = db.query(MarketData).count()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [
            {
                "symbol": d.symbol,
                "price": d.price,
                "currency": d.currency,
                "date": d.date,
                "source": d.source,
            }
            for d in data
        ],
    }


@router.get("/lookup-etf/{isin}/{currency}")
async def lookup_etf(isin: str, currency: str):
    """
    Look up ETF by ISIN and currency.
    Returns ticker symbol and fund name for the correct exchange/currency.

    Example: GET /api/market/lookup-etf/IE000I8KRLL9/EUR
    """
    logger.info(f"Looking up ISIN {isin} in {currency}")

    # Map ISIN + currency to ticker + name
    etf_db = {
        # IB (Interactive Brokers)
        ("IE000I8KRLL9", "EUR"): ("SEMI.AS", "iShares MSCI Global Semiconductors UCITS ETF"),
        ("IE000I8KRLL9", "GBP"): ("SEMI.L", "iShares MSCI Global Semiconductors UCITS ETF"),
        ("IE000I8KRLL9", "CHF"): ("SEMI.SW", "iShares MSCI Global Semiconductors UCITS ETF"),
        ("GSD.SI", "SGD"): ("GSD.SI", "SPDR Gold Shares"),

        # LCL
        ("IE0004766675", "EUR"): ("IE0004766675", "Comgest Growth Europe Acc"),
        ("IE00B1Z6D669", "EUR"): ("IE00B1Z6D669", "PIMCO Diversified Income Fund E EUR Hedged"),
        ("LU1261432659", "EUR"): ("LU1261432659", "Fidelity Funds - World Fund A-Acc-EUR"),
        ("LU0292585626", "EUR"): ("LU0292585626", "AXA IM US Short Duration High Yield"),

        # Deferred
        ("ANZ.AX", "AUD"): ("ANZ.AX", "Australia and New Zealand Banking Group"),

        # Other existing
        ("IE00B4L5Y983", "EUR"): ("VGUV.AS", "Vanguard S&P 500 UCITS ETF"),
        ("IE00B4L5Y983", "GBP"): ("VGUV.L", "Vanguard S&P 500 UCITS ETF"),
        ("IE00BFXVGX16", "EUR"): ("VEUR.AS", "Vanguard FTSE Developed Europe ex-UK UCITS ETF"),
        ("IE00BFXVGX16", "GBP"): ("VEUR.L", "Vanguard FTSE Developed Europe ex-UK UCITS ETF"),
        ("IE00B5BMR087", "EUR"): ("VWRL.AS", "Vanguard FTSE Developed World UCITS ETF"),
        ("IE00B5BMR087", "GBP"): ("VWRL.L", "Vanguard FTSE Developed World UCITS ETF"),
    }

    key = (isin, currency)
    if key in etf_db:
        ticker, name = etf_db[key]
        logger.info(f"✓ Found {ticker}: {name}")

        # Fetch current price
        price = MarketFetcher.fetch_stock_price(ticker, currency)

        return {
            "success": True,
            "isin": isin,
            "currency": currency,
            "ticker": ticker,
            "name": name,
            "price": price,
        }

    logger.warning(f"ETF not found: {isin} in {currency}")
    return {
        "success": False,
        "isin": isin,
        "currency": currency,
        "message": f"No mapping for {isin} in {currency}. Add to database or check ISIN.",
    }
