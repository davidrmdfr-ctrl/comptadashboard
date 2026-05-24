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
    investment_type: str  # "stock", "etf", "bond", "crypto"
    quantity: float
    cost_basis: float
    cost_per_unit: Optional[float] = None
    currency: str = "USD"
    current_price: float = 0.0
    yield_pct: Optional[float] = None
    acquisition_date: Optional[date] = None
    account_name: Optional[str] = None


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
        eur_amount=investment.cost_basis,  # Default to cost basis in EUR
        current_price=investment.current_price,
        yield_pct=investment.yield_pct,
        acquisition_date=investment.acquisition_date,
        account_name=investment.account_name,
    )
    db.add(db_investment)
    db.commit()
    db.refresh(db_investment)
    return db_investment


@router.delete("/{investment_id}")
async def delete_investment(investment_id: int, db: Session = Depends(get_db)):
    """Delete an investment"""
    investment = db.query(Investment).filter(Investment.id == investment_id).first()
    if not investment:
        raise HTTPException(status_code=404, detail="Investment not found")

    db.delete(investment)
    db.commit()
    return {"message": f"Investment {investment_id} deleted"}
