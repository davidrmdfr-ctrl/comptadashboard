"""
Cash accounts API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from backend.database import get_db
from backend.db import CashAccount

logger = logging.getLogger(__name__)

router = APIRouter()


class AccountCreate(BaseModel):
    """Create a new account"""
    account_name: str
    currency: str
    amount: float
    parent_id: Optional[int] = None


class AccountUpdate(BaseModel):
    """Update an account"""
    amount: Optional[float] = None
    account_name: Optional[str] = None
    account_type: Optional[str] = None


class AccountResponse(BaseModel):
    """Response model for account"""
    id: int
    currency: str
    amount: float
    eur_amount: float
    exchange_rate: float
    account_name: Optional[str] = None
    account_type: Optional[str] = None
    parent_id: Optional[int] = None

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
    """Update an account (amount, name, type)"""
    account = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    if update.amount is not None:
        account.amount = update.amount
        account.eur_amount = update.amount * account.exchange_rate

    if update.account_name is not None:
        account.account_name = update.account_name
    if update.account_type is not None:
        account.account_type = update.account_type

    db.commit()
    db.refresh(account)
    return account


@router.post("/", response_model=AccountResponse)
async def create_account(
    account: AccountCreate,
    db: Session = Depends(get_db),
):
    """Create a new account"""
    db_account = CashAccount(
        account_name=account.account_name,
        currency=account.currency,
        amount=account.amount,
        eur_amount=account.amount,
        exchange_rate=1.0,
        parent_id=account.parent_id,
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.delete("/{account_id}")
async def delete_account(account_id: int, db: Session = Depends(get_db)):
    """Delete an account"""
    account = db.query(CashAccount).filter(CashAccount.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    db.delete(account)
    db.commit()
    return {"message": f"Account {account_id} deleted"}
