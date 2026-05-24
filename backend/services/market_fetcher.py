"""
Market data fetcher service.

Pulls live prices from free sources:
- yfinance: Stocks, ETFs, indices (Yahoo Finance)
- CoinGecko: Crypto (no auth required)
"""

import logging
from datetime import datetime, date
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

try:
    import yfinance as yf
except ImportError:
    yf = None

try:
    import requests
except ImportError:
    requests = None


class MarketFetcher:
    """Fetch market prices from external sources"""

    @staticmethod
    def fetch_stock_price(symbol: str, currency: str = "USD") -> Optional[float]:
        """
        Fetch stock/ETF price from Yahoo Finance.

        Args:
            symbol: Ticker symbol (e.g., "DBS.SI" for DBS Singapore)
            currency: Currency of the ticker

        Returns:
            Current price or None if fetch fails
        """
        if not yf:
            logger.warning("yfinance not installed, skipping stock fetch")
            return None

        try:
            ticker = yf.Ticker(symbol)
            data = ticker.history(period="1d")

            if data.empty:
                logger.warning(f"No data for {symbol}")
                return None

            price = data["Close"].iloc[-1]
            logger.info(f"Fetched {symbol}: {price} {currency}")
            return float(price)

        except Exception as e:
            logger.error(f"Error fetching {symbol}: {e}")
            return None

    @staticmethod
    def fetch_crypto_price(crypto_id: str, vs_currency: str = "eur") -> Optional[float]:
        """
        Fetch crypto price from CoinGecko (free, no auth required).

        Args:
            crypto_id: CoinGecko ID (e.g., "bitcoin", "ethereum")
            vs_currency: Target currency (default "eur")

        Returns:
            Current price or None if fetch fails
        """
        if not requests:
            logger.warning("requests not installed, skipping crypto fetch")
            return None

        try:
            url = f"https://api.coingecko.com/api/v3/simple/price"
            params = {
                "ids": crypto_id,
                "vs_currencies": vs_currency,
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            if crypto_id in data and vs_currency in data[crypto_id]:
                price = data[crypto_id][vs_currency]
                logger.info(f"Fetched {crypto_id}: {price} {vs_currency}")
                return float(price)
            else:
                logger.warning(f"No data for {crypto_id}")
                return None

        except Exception as e:
            logger.error(f"Error fetching {crypto_id}: {e}")
            return None

    @staticmethod
    def fetch_exchange_rate(from_currency: str, to_currency: str = "EUR") -> Optional[float]:
        """
        Fetch exchange rate using yfinance.

        Args:
            from_currency: Source currency code (e.g., "SGD")
            to_currency: Target currency code (default "EUR")

        Returns:
            Exchange rate or None if fetch fails
        """
        if not yf:
            logger.warning("yfinance not installed, skipping exchange rate fetch")
            return None

        try:
            # Construct currency pair ticker for yfinance
            # Format: SGDEUR=X for SGD to EUR conversion
            pair = f"{from_currency}{to_currency}=X"
            ticker = yf.Ticker(pair)
            data = ticker.history(period="1d")

            if data.empty:
                logger.warning(f"No exchange rate data for {pair}")
                return None

            rate = data["Close"].iloc[-1]
            logger.info(f"Fetched exchange rate {pair}: {rate}")
            return float(rate)

        except Exception as e:
            logger.error(f"Error fetching exchange rate {pair}: {e}")
            return None

    @staticmethod
    def batch_fetch_stocks(symbols: List[str]) -> Dict[str, Optional[float]]:
        """
        Fetch multiple stock prices at once.

        Args:
            symbols: List of ticker symbols

        Returns:
            Dict mapping symbol -> price (None if failed)
        """
        results = {}
        for symbol in symbols:
            results[symbol] = MarketFetcher.fetch_stock_price(symbol)
        return results

    @staticmethod
    def batch_fetch_exchange_rates(currencies: List[str], target: str = "EUR") -> Dict[str, Optional[float]]:
        """
        Fetch exchange rates for multiple currencies.

        Args:
            currencies: List of currency codes (e.g., ["SGD", "GBP", "USD"])
            target: Target currency (default "EUR")

        Returns:
            Dict mapping currency -> rate (None if failed)
        """
        results = {}
        for currency in currencies:
            if currency == target:
                results[currency] = 1.0  # 1:1 rate for same currency
            else:
                results[currency] = MarketFetcher.fetch_exchange_rate(currency, target)
        return results
