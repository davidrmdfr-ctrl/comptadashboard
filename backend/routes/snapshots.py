"""
Monthly Snapshots API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.database import get_db
from backend.db import MonthlySnapshot

logger = logging.getLogger(__name__)

router = APIRouter()


class SnapshotCreate(BaseModel):
    """Create a new snapshot"""
    total_assets_eur: float
    total_debt_eur: float
    net_equity_eur: float
    cash_breakdown: Optional[str] = None
    notes: Optional[str] = None


class SnapshotResponse(BaseModel):
    """Response model for snapshot"""
    id: int
    date: date
    total_assets_eur: float
    total_debt_eur: float
    net_equity_eur: float
    cash_breakdown: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class LatestSnapshotsResponse(BaseModel):
    """Response model for latest snapshots endpoint"""
    current: Optional[SnapshotResponse] = None
    previous: Optional[SnapshotResponse] = None


@router.get("/", response_model=list[SnapshotResponse])
async def list_snapshots(db: Session = Depends(get_db)):
    """List all snapshots ordered by date desc"""
    snapshots = db.query(MonthlySnapshot).order_by(MonthlySnapshot.date.desc()).all()
    return snapshots


@router.get("/latest", response_model=LatestSnapshotsResponse)
async def get_latest_snapshots(db: Session = Depends(get_db)):
    """Get the last 2 snapshots (current + previous month)"""
    snapshots = db.query(MonthlySnapshot).order_by(MonthlySnapshot.date.desc()).limit(2).all()

    current = snapshots[0] if len(snapshots) > 0 else None
    previous = snapshots[1] if len(snapshots) > 1 else None

    return {
        "current": current,
        "previous": previous,
    }


@router.post("/", response_model=SnapshotResponse)
async def create_snapshot(
    snapshot: SnapshotCreate,
    db: Session = Depends(get_db),
):
    """Create a new snapshot"""
    today = date.today()

    # Check if snapshot already exists for today
    existing = db.query(MonthlySnapshot).filter(MonthlySnapshot.date == today).first()
    if existing:
        raise HTTPException(status_code=400, detail="Snapshot already exists for today")

    db_snapshot = MonthlySnapshot(
        date=today,
        total_assets_eur=snapshot.total_assets_eur,
        total_debt_eur=snapshot.total_debt_eur,
        net_equity_eur=snapshot.net_equity_eur,
        cash_breakdown=snapshot.cash_breakdown,
        notes=snapshot.notes,
    )
    db.add(db_snapshot)
    db.commit()
    db.refresh(db_snapshot)
    return db_snapshot
