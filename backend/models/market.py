"""
Pydantic models for market data API
"""

from datetime import datetime
from typing import Optional, Dict, List
from pydantic import BaseModel, Field


class PriceRefreshRequest(BaseModel):
    """Request to refresh prices for specific symbols"""
    symbols: List[str] = Field(..., description="List of symbols to refresh (e.g., ['DBS.SI', 'HSBC.HK'])")
    refresh_type: str = Field(
        default="stock",
        description="Type: 'stock', 'crypto', or 'all'"
    )


class ExchangeRateRefreshRequest(BaseModel):
    """Request to refresh exchange rates"""
    currencies: List[str] = Field(..., description="Currency codes to refresh (e.g., ['SGD', 'GBP', 'USD'])")
    target_currency: str = Field(default="EUR", description="Target currency")


class MarketDataResponse(BaseModel):
    """Response with market data"""
    symbol: str
    price: Optional[float]
    currency: str
    date: datetime
    source: str = "yfinance"


class PriceRefreshResponse(BaseModel):
    """Response after refreshing prices"""
    success: bool
    message: str
    prices_fetched: int
    prices_stored: int
    data: Dict[str, Optional[float]]  # symbol -> price


class ExchangeRateResponse(BaseModel):
    """Response with exchange rates"""
    from_currency: str
    to_currency: str
    rate: Optional[float]
    date: datetime


class ExchangeRateRefreshResponse(BaseModel):
    """Response after refreshing exchange rates"""
    success: bool
    message: str
    rates_fetched: int
    rates_updated: int
    data: Dict[str, Optional[float]]  # currency -> rate
