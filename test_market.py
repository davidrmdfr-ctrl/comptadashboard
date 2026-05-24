#!/usr/bin/env python3
"""
Test script for market data fetching.

Run this to verify that yfinance and exchange rate fetching work.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from backend.services.market_fetcher import MarketFetcher


def test_fetch_stocks():
    """Test fetching stock prices"""
    print("\n=== Testing Stock Price Fetching ===")

    symbols = ["AAPL", "MSFT", "GOOGL"]  # Apple, Microsoft, Google (more reliable)

    for symbol in symbols:
        price = MarketFetcher.fetch_stock_price(symbol)
        if price:
            print(f"[OK] {symbol}: ${price:.2f}")
        else:
            print(f"[FAIL] {symbol}: Failed to fetch")


def test_fetch_exchange_rates():
    """Test fetching exchange rates"""
    print("\n=== Testing Exchange Rate Fetching ===")

    currencies = ["SGD", "GBP", "USD", "HKD", "JPY", "AUD"]

    rates = MarketFetcher.batch_fetch_exchange_rates(currencies, target="EUR")

    for currency, rate in rates.items():
        if rate:
            print(f"[OK] {currency}/EUR: {rate:.4f}")
        else:
            print(f"[FAIL] {currency}/EUR: Failed to fetch")


def test_fetch_crypto():
    """Test fetching crypto prices"""
    print("\n=== Testing Crypto Price Fetching ===")

    cryptos = [
        ("bitcoin", "BTC"),
        ("ethereum", "ETH"),
    ]

    for crypto_id, symbol in cryptos:
        price = MarketFetcher.fetch_crypto_price(crypto_id, vs_currency="eur")
        if price:
            print(f"[OK] {symbol}: {price:.2f} EUR")
        else:
            print(f"[FAIL] {symbol}: Failed to fetch")


if __name__ == "__main__":
    print("Testing Market Data Fetcher")
    print("=" * 50)

    try:
        test_fetch_stocks()
    except Exception as e:
        print(f"Stock fetch error: {e}")

    try:
        test_fetch_exchange_rates()
    except Exception as e:
        print(f"Exchange rate error: {e}")

    try:
        test_fetch_crypto()
    except Exception as e:
        print(f"Crypto fetch error: {e}")

    print("\n" + "=" * 50)
    print("Testing complete!")
