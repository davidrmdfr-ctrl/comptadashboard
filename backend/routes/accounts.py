"""
Cash accounts API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend.database import get_db
from backend.db import CashAccount

logger = logging.getLogger(__name__)

router = APIRouter()


class AccountUpdate(BaseModel):
    """Update an account"""
    amount: float
    account_name: str = None
    account_type: str = None


class AccountResponse(BaseModel):
    """Response model for account"""
    id: int
    currency: str
    amount: float
    eur_amount: float
    exchange_rate: float
    account_name: str = None
    account_type: str = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[AccountResponse])
async def list_accounts(db: Session = Depends(get_db)):
    """List all cash accounts"""
    accounts = db.query(CashAccount).all()
    return accounts


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(account_id: int, db: Session = Depends(get_db)):
    """Get a specific account"""
    account = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.patch("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: int,
    update: AccountUpdate,
    db: Session = Depends(get_db),
):
    """Update an account amount (auto-recalculates EUR amount)"""
    account = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    account.amount = update.amount
    account.eur_amount = update.amount * account.exchange_rate

    if update.account_name:
        account.account_name = update.account_name
    if update.account_type:
        account.account_type = update.account_type

    db.commit()
    db.refresh(account)
    return account
