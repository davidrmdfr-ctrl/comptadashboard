"""
Properties API routes.
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from typing import Optional

from backend.database import get_db
from backend.db import Property, PropertyAmortization, PropertyEquity

logger = logging.getLogger(__name__)

router = APIRouter()


class PropertyEquityInfo(BaseModel):
    """Latest equity for a property"""
    month: int
    date: date
    net_equity: float
    real_net_equity: float

    class Config:
        from_attributes = True


class PropertyResponse(BaseModel):
    """Response model for property"""
    id: int
    name: str
    location: Optional[str]
    property_type: str
    purchase_date: Optional[date]
    purchase_price: float
    current_value: float
    currency: str
    notes: Optional[str]
    latest_equity: Optional[PropertyEquityInfo] = None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[PropertyResponse])
async def list_properties(db: Session = Depends(get_db)):
    """List all properties with latest equity"""
    properties = db.query(Property).all()

    results = []
    for prop in properties:
        # Get latest equity record
        latest_equity = (
            db.query(PropertyEquity)
            .filter(PropertyEquity.property_id == prop.id)
            .order_by(PropertyEquity.month.desc())
            .first()
        )

        results.append(
            PropertyResponse(
                id=prop.id,
                name=prop.name,
                location=prop.location,
                property_type=prop.property_type,
                purchase_date=prop.purchase_date,
                purchase_price=prop.purchase_price,
                current_value=prop.current_value,
                currency=prop.currency,
                notes=prop.notes,
                latest_equity=latest_equity,
            )
        )

    return results


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: int, db: Session = Depends(get_db)):
    """Get a specific property"""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    latest_equity = (
        db.query(PropertyEquity)
        .filter(PropertyEquity.property_id == property_id)
        .order_by(PropertyEquity.month.desc())
        .first()
    )

    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        location=prop.location,
        property_type=prop.property_type,
        purchase_date=prop.purchase_date,
        purchase_price=prop.purchase_price,
        current_value=prop.current_value,
        currency=prop.currency,
        notes=prop.notes,
        latest_equity=latest_equity,
    )
