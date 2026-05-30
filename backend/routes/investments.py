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
    cost_basis: float
    cost_per_unit: Optional[float] = None
    currency: str = "USD"
    current_price: float = 0.0
    yield_pct: Optional[float] = None
    acquisition_date: Optional[date] = None
    account_name: Optional[str] = None
    is_broker: Optional[bool] = False
    parent_id: Optional[int] = None
    eur_amount: Optional[float] = None


class InvestmentUpdate(BaseModel):
    """Update an investment"""
    name: Optional[str] = None
    investment_type: Optional[str] = None
    quantity: Optional[float] = None
    cost_basis: Optional[float] = None
    cost_per_unit: Optional[float] = None
    current_price: Optional[float] = None
    eur_amount: Optional[float] = None
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
    cost_basis: float
    cost_per_unit: Optional[float]
    currency: str
    eur_amount: float
    current_price: float
    yield_pct: Optional[float]
    acquisition_date: Optional[date]
    account_name: Optional[str]
    is_broker: bool
    parent_id: Optional[int]

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
    db_investment = Investment(
        symbol=investment.symbol,
        name=investment.name,
        investment_type=investment.investment_type,
        quantity=investment.quantity,
        cost_basis=investment.cost_basis,
        cost_per_unit=investment.cost_per_unit,
        currency=investment.currency,
        eur_amount=investment.eur_amount or investment.cost_basis,
        current_price=investment.current_price,
        yield_pct=investment.yield_pct,
        acquisition_date=investment.acquisition_date,
        account_name=investment.account_name,
        is_broker=investment.is_broker or False,
        parent_id=investment.parent_id,
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
    if update.cost_basis is not None:
        investment.cost_basis = update.cost_basis
    if update.cost_per_unit is not None:
        investment.cost_per_unit = update.cost_per_unit
    if update.current_price is not None:
        investment.current_price = update.current_price
    if update.eur_amount is not None:
        investment.eur_amount = update.eur_amount
    if update.yield_pct is not None:
        investment.yield_pct = update.yield_pct
    if update.acquisition_date is not None:
        investment.acquisition_date = update.acquisition_date
    if update.account_name is not None:
        investment.account_name = update.account_name

    db.commit()
    db.refresh(investment)
    return investment


@router.delete("/{investment_id}")
async def delete_investment(investment_id: int, db: Session = Depends(get_db)):
    """Delete an investment"""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    db.delete(investment)
    db.commit()
    return {"message": f"Investment {investment_id} deleted"}
