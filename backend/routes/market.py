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
from backend.db import MarketData, CashAccount
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
    logger.info(f"Refreshing prices for {request.symbols}")

    prices_fetched = 0
    prices_stored = 0
    results = {}

    # Fetch prices
    if request.refresh_type in ("stock", "all"):
        for symbol in request.symbols:
            price = MarketFetcher.fetch_stock_price(symbol)
            if price is not None:
                prices_fetched += 1
                results[symbol] = price

                # Store in database
                market_data = MarketData(
                    symbol=symbol,
                    price=price,
                    currency="USD",  # Assume USD for now, could be expanded
                    date=date.today(),
                    source="yfinance",
                )
                db.add(market_data)
                prices_stored += 1

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Error storing prices: {e}")
        raise HTTPException(status_code=500, detail=f"Error storing prices: {e}")

    message = f"Fetched {prices_fetched} prices, stored {prices_stored}"
    logger.info(message)

    return PriceRefreshResponse(
        success=prices_stored > 0,
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
