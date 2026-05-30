"""
Loans API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.database import get_db
from backend.db import Loan

logger = logging.getLogger(__name__)

router = APIRouter()


class LoanCreate(BaseModel):
    """Create a new loan"""
    name: str
    loan_type: str  # "mortgage", "personal", "car", "business"
    original_amount: float
    original_currency: str = "EUR"
    principal_left: float
    next_payment_amount: float
    next_payment_date: date
    interest_rate: Optional[float] = None
    payment_frequency: str = "monthly"
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None


class LoanUpdate(BaseModel):
    """Update a loan"""
    name: Optional[str] = None
    loan_type: Optional[str] = None
    original_amount: Optional[float] = None
    original_currency: Optional[str] = None
    principal_left: Optional[float] = None
    next_payment_amount: Optional[float] = None
    next_payment_date: Optional[date] = None
    interest_rate: Optional[float] = None
    payment_frequency: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    notes: Optional[str] = None


class LoanResponse(BaseModel):
    """Response model for loan"""
    id: int
    name: str
    loan_type: str
    original_amount: float
    original_currency: str
    principal_left: float
    next_payment_amount: float
    next_payment_date: date
    interest_rate: Optional[float]
    payment_frequency: str
    start_date: date
    end_date: Optional[date]
    notes: Optional[str]

    class Config:
        from_attributes = True


@router.get("/", response_model=list[LoanResponse])
async def list_loans(db: Session = Depends(get_db)):
    """List all loans"""
    loans = db.query(Loan).all()
    return loans


@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(loan_id: int, db: Session = Depends(get_db)):
    """Get a specific loan"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    return loan


@router.post("/", response_model=LoanResponse)
async def create_loan(
    loan: LoanCreate,
    db: Session = Depends(get_db),
):
    """Create a new loan"""
    db_loan = Loan(
        name=loan.name,
        loan_type=loan.loan_type,
        original_amount=loan.original_amount,
        original_currency=loan.original_currency,
        principal_left=loan.principal_left,
        next_payment_amount=loan.next_payment_amount,
        next_payment_date=loan.next_payment_date,
        interest_rate=loan.interest_rate,
        payment_frequency=loan.payment_frequency,
        start_date=loan.start_date,
        end_date=loan.end_date,
        notes=loan.notes,
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan


@router.patch("/{loan_id}", response_model=LoanResponse)
async def update_loan(
    loan_id: int,
    update: LoanUpdate,
    db: Session = Depends(get_db),
):
    """Update a loan"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if update.name is not None:
        loan.name = update.name
    if update.loan_type is not None:
        loan.loan_type = update.loan_type
    if update.original_amount is not None:
        loan.original_amount = update.original_amount
    if update.original_currency is not None:
        loan.original_currency = update.original_currency
    if update.principal_left is not None:
        loan.principal_left = update.principal_left
    if update.next_payment_amount is not None:
        loan.next_payment_amount = update.next_payment_amount
    if update.next_payment_date is not None:
        loan.next_payment_date = update.next_payment_date
    if update.interest_rate is not None:
        loan.interest_rate = update.interest_rate
    if update.payment_frequency is not None:
        loan.payment_frequency = update.payment_frequency
    if update.start_date is not None:
        loan.start_date = update.start_date
    if update.end_date is not None:
        loan.end_date = update.end_date
    if update.notes is not None:
        loan.notes = update.notes

    db.commit()
    db.refresh(loan)
    return loan


@router.delete("/{loan_id}")
async def delete_loan(loan_id: int, db: Session = Depends(get_db)):
    """Delete a loan"""
    loan = db.query(Loan).filter(Loan.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    db.delete(loan)
    db.commit()
    return {"message": f"Loan {loan_id} deleted"}
