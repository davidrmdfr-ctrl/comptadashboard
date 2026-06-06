"""
Investments API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.database import get_db
from backend.db import Investment

logger = logging.getLogger(__name__)

router = APIRouter()


class InvestmentCreate(BaseModel):
    """Create a new investment"""
    symbol: str
    name: Optional[str] = None
    investment_type: str  # "stock", "etf", "bond", "crypto", "broker"
    quantity: float
    initial_amount: float
    cost_per_unit: Optional[float] = None
    currency: str = "USD"
    exchange_rate: float = 1.0
    eur_initial_amount: Optional[float] = None
    current_price: float = 0.0
    current_amount: Optional[float] = None
    eur_current_amount: Optional[float] = None
    yield_pct: Optional[float] = None
    acquisition_date: Optional[date] = None
    account_name: Optional[str] = None
    is_broker: Optional[bool] = False
    parent_id: Optional[int] = None
    isin: Optional[str] = None
    ticker_symbol: Optional[str] = None


class InvestmentUpdate(BaseModel):
    """Update an investment"""
    name: Optional[str] = None
    investment_type: Optional[str] = None
    quantity: Optional[float] = None
    initial_amount: Optional[float] = None
    cost_per_unit: Optional[float] = None
    exchange_rate: Optional[float] = None
    eur_initial_amount: Optional[float] = None
    current_price: Optional[float] = None
    current_amount: Optional[float] = None
    eur_current_amount: Optional[float] = None
    yield_pct: Optional[float] = None
    acquisition_date: Optional[date] = None
    account_name: Optional[str] = None
    is_broker: Optional[bool] = None
    parent_id: Optional[int] = None


class InvestmentResponse(BaseModel):
    """Response model for investment"""
    id: int
    symbol: str
    name: Optional[str]
    investment_type: str
    quantity: float
    initial_amount: float
    cost_per_unit: Optional[float]
    currency: str
    exchange_rate: float
    eur_initial_amount: float
    current_price: float
    current_amount: float
    eur_current_amount: float
    yield_pct: Optional[float]
    acquisition_date: Optional[date]
    account_name: Optional[str]
    is_broker: bool
    parent_id: Optional[int]
    isin: Optional[str]
    ticker_symbol: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[InvestmentResponse])
async def list_investments(db: Session = Depends(get_db)):
    """List all investments"""
    investments = db.query(Investment).all()
    return investments


@router.get("/{investment_id}", response_model=InvestmentResponse)
async def get_investment(investment_id: int, db: Session = Depends(get_db)):
    """Get a specific investment"""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")
    return investment


@router.post("/", response_model=InvestmentResponse)
async def create_investment(
    investment: InvestmentCreate,
    db: Session = Depends(get_db),
):
    """Create a new investment"""
    fx_rate = investment.exchange_rate or 1.0
    initial_amt = investment.initial_amount or 0
    current_amt = investment.current_amount or initial_amt
    qty = investment.quantity or 1

    # Calculate cost_per_unit if not provided
    cost_per_unit = investment.cost_per_unit
    if not cost_per_unit and qty > 0:
        cost_per_unit = initial_amt / qty

    db_investment = Investment(
        symbol=investment.symbol,
        name=investment.name,
        investment_type=investment.investment_type,
        quantity=qty,
        initial_amount=initial_amt,
        cost_per_unit=cost_per_unit,
        currency=investment.currency,
        exchange_rate=fx_rate,
        eur_initial_amount=investment.eur_initial_amount or (initial_amt * fx_rate),
        current_price=investment.current_price or 0,
        current_amount=current_amt,
        eur_current_amount=investment.eur_current_amount or (current_amt * fx_rate),
        yield_pct=investment.yield_pct,
        acquisition_date=investment.acquisition_date,
        account_name=investment.account_name,
        is_broker=investment.is_broker or False,
        parent_id=investment.parent_id,
        isin=investment.isin,
        ticker_symbol=investment.ticker_symbol,
    )
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment


@router.patch("/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: int,
    update: InvestmentUpdate,
    db: Session = Depends(get_db),
):
    """Update an investment"""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    if update.name is not None:
        investment.name = update.name
    if update.investment_type is not None:
        investment.investment_type = update.investment_type
    if update.quantity is not None:
        investment.quantity = update.quantity
    if update.initial_amount is not None:
        investment.initial_amount = update.initial_amount
    if update.cost_per_unit is not None:
        investment.cost_per_unit = update.cost_per_unit
    if update.exchange_rate is not None:
        investment.exchange_rate = update.exchange_rate
    if update.eur_initial_amount is not None:
        investment.eur_initial_amount = update.eur_initial_amount
    if update.current_price is not None:
        investment.current_price = update.current_price
    if update.current_amount is not None:
        investment.current_amount = update.current_amount
    if update.eur_current_amount is not None:
        investment.eur_current_amount = update.eur_current_amount
    if update.yield_pct is not None:
        investment.yield_pct = update.yield_pct
    if update.acquisition_date is not None:
        investment.acquisition_date = update.acquisition_date
    if update.account_name is not None:
        investment.account_name = update.account_name

    # Recalculate EUR amounts if needed
    if investment.initial_amount and investment.exchange_rate:
        investment.eur_initial_amount = investment.initial_amount * investment.exchange_rate
    if investment.current_amount and investment.exchange_rate:
        investment.eur_current_amount = investment.current_amount * investment.exchange_rate
    # Calculate current_amount from quantity and price if needed
    if investment.quantity and investment.current_price:
        investment.current_amount = investment.quantity * investment.current_price
        investment.eur_current_amount = investment.current_amount * (investment.exchange_rate or 1.0)

    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/{investment_id}")
async def delete_investment(investment_id: int, db: Session = Depends(get_db)):
    """Delete an investment"""
    try:
        investment = db.query(Investment).filter(Investment.id == investment_id).first()
        if not investment:
            raise HTTPException(status_code=404, detail="Investment not found")

        # If this is a broker with children, delete children first
        if investment.is_broker and investment.children:
            for child in investment.children:
                db.delete(child)

        db.delete(investment)
        db.commit()
        return {"message": f"Investment {investment_id} deleted"}
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting investment {investment_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error deleting investment: {str(e)}")
