"""
Market data fetcher service.

Pulls live prices from free sources:
- yfinance: Stocks, ETFs, indices (Yahoo Finance)
- CoinGecko: Crypto (no auth required)
- ISIN mapping: Maps fund ISINs to exchange-specific ticker symbols
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


# ISIN to ticker symbol mapping (common funds and ETFs)
# Format: ISIN -> list of (ticker, exchange, currency) tuples
ISIN_TO_TICKER = {
    "LU1261432659": [  # Fidelity World Fund A-Acc-EUR
        ("0P00016FY4.F", "Euronext Frankfurt", "EUR"),
    ],
    # Add more ISINs as needed
}


class MarketFetcher:
    """Fetch market prices from external sources"""

    @staticmethod
    def get_ticker_for_isin(isin: str, preferred_currency: str = "EUR") -> Optional[str]:
        """
        Get the best ticker symbol for an ISIN, preferring the specified currency.

        Args:
            isin: ISIN code (e.g., "LU1261432659")
            preferred_currency: Preferred currency (default "EUR")

        Returns:
            Ticker symbol or None if not found
        """
        if isin not in ISIN_TO_TICKER:
            logger.warning(f"ISIN {isin} not in mapping - using as ticker directly (may fail)")
            return None

        tickers = ISIN_TO_TICKER[isin]

        # Try to find preferred currency first
        for ticker, exchange, currency in tickers:
            if currency == preferred_currency:
                logger.info(f"ISIN {isin} -> {ticker} ({exchange}, {currency})")
                return ticker

        # Fallback to first available
        ticker, exchange, currency = tickers[0]
        logger.info(f"ISIN {isin} -> {ticker} ({exchange}, {currency}) [preferred {preferred_currency} not available]")
        return ticker

    @staticmethod
    def fetch_stock_price(symbol: str, currency: str = "USD", isin: str = None) -> Optional[float]:
        """
        Fetch stock/ETF price from Yahoo Finance.

        Args:
            symbol: Ticker symbol (e.g., "DBS.SI" for DBS Singapore) or ISIN if ticker_symbol not available
            currency: Currency of the ticker
            isin: Optional ISIN to resolve to correct ticker symbol

        Returns:
            Current price or None if fetch fails
        """
        if not yf:
            logger.warning("yfinance not installed, skipping stock fetch")
            return None

        # Try to resolve ISIN to ticker if provided
        actual_symbol = symbol
        if isin:
            ticker_from_isin = MarketFetcher.get_ticker_for_isin(isin, currency)
            if ticker_from_isin:
                actual_symbol = ticker_from_isin
                logger.info(f"Resolved ISIN {isin} to ticker {actual_symbol}")

        try:
            logger.info(f"Fetching price for {actual_symbol}...")
            ticker = yf.Ticker(actual_symbol)
            
            # Try 1 day first, fall back to longer periods if no data
            for period in ["1d", "5d", "1mo", "6mo"]:
                data = ticker.history(period=period)
                if not data.empty:
                    price = data["Close"].iloc[-1]
                    logger.info(f"✓ Fetched {actual_symbol}: {price} {currency} (period={period})")
                    return float(price)
            
            logger.warning(f"No data for {actual_symbol} - tried periods: 1d, 5d, 1mo, 6mo")
            return None

        except Exception as e:
            logger.error(f"✗ Error fetching {actual_symbol}: {e}")
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

    @staticmethod
    def resolve_isin_to_ticker(isin: str) -> Optional[str]:
        """
        Resolve ISIN to ticker by searching common exchanges.

        Tries the ISIN directly first, then common exchange suffixes.

        Args:
            isin: ISIN code (e.g., "IE000I8KRLL9")

        Returns:
            Ticker symbol if found, None otherwise
        """
        if not yf:
            logger.warning("yfinance not installed")
            return None

        # Try the ISIN directly first
        try:
            logger.info(f"Trying ISIN directly: {isin}")
            ticker = yf.Ticker(isin)
            data = ticker.history(period="1d")
            if not data.empty:
                logger.info(f"✓ Found {isin} directly")
                return isin
        except Exception as e:
            logger.debug(f"Direct ISIN lookup failed: {e}")

        # Try common exchange suffixes for European ETFs
        exchanges = [".L", ".MI", ".PA", ".DE", ".SIX", ".VX"]
        for suffix in exchanges:
            try:
                test_ticker = isin + suffix
                logger.info(f"Trying {test_ticker}...")
                ticker = yf.Ticker(test_ticker)
                data = ticker.history(period="1d")
                if not data.empty:
                    logger.info(f"✓ Found {test_ticker}")
                    return test_ticker
            except Exception as e:
                logger.debug(f"Failed {test_ticker}: {e}")
                continue

        logger.warning(f"Could not resolve ISIN {isin}")
        return None
