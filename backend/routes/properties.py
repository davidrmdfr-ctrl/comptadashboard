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


class PropertyCreate(BaseModel):
    """Create a new property"""
    name: str
    location: Optional[str] = None
    property_type: str = "residential"
    purchase_date: Optional[date] = None
    purchase_price: float
    current_value: float
    currency: str = "EUR"
    rental_income: Optional[float] = 0
    coupon_rate: Optional[float] = 0
    notes: Optional[str] = None


class PropertyUpdate(BaseModel):
    """Update a property"""
    name: Optional[str] = None
    location: Optional[str] = None
    property_type: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_price: Optional[float] = None
    current_value: Optional[float] = None
    currency: Optional[str] = None
    rental_income: Optional[float] = None
    coupon_rate: Optional[float] = None
    notes: Optional[str] = None


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
    rental_income: float
    coupon_rate: float
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
                rental_income=prop.rental_income,
                coupon_rate=prop.coupon_rate,
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
        rental_income=prop.rental_income,
        coupon_rate=prop.coupon_rate,
        notes=prop.notes,
        latest_equity=latest_equity,
    )


@router.post("/", response_model=PropertyResponse)
async def create_property(
    property: PropertyCreate,
    db: Session = Depends(get_db),
):
    """Create a new property"""
    db_property = Property(
        name=property.name,
        location=property.location,
        property_type=property.property_type,
        purchase_date=property.purchase_date,
        purchase_price=property.purchase_price,
        current_value=property.current_value,
        currency=property.currency,
        rental_income=property.rental_income or 0,
        coupon_rate=property.coupon_rate or 0,
        notes=property.notes,
    )
    db.add(db_property)
    db.commit()
    db.refresh(db_property)
    return PropertyResponse(
        id=db_property.id,
        name=db_property.name,
        location=db_property.location,
        property_type=db_property.property_type,
        purchase_date=db_property.purchase_date,
        purchase_price=db_property.purchase_price,
        current_value=db_property.current_value,
        currency=db_property.currency,
        rental_income=db_property.rental_income,
        coupon_rate=db_property.coupon_rate,
        notes=db_property.notes,
    )


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int,
    update: PropertyUpdate,
    db: Session = Depends(get_db),
):
    """Update a property"""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    if update.name is not None:
        prop.name = update.name
    if update.location is not None:
        prop.location = update.location
    if update.property_type is not None:
        prop.property_type = update.property_type
    if update.purchase_date is not None:
        prop.purchase_date = update.purchase_date
    if update.purchase_price is not None:
        prop.purchase_price = update.purchase_price
    if update.current_value is not None:
        prop.current_value = update.current_value
    if update.currency is not None:
        prop.currency = update.currency
    if update.rental_income is not None:
        prop.rental_income = update.rental_income
    if update.coupon_rate is not None:
        prop.coupon_rate = update.coupon_rate
    if update.notes is not None:
        prop.notes = update.notes

    db.commit()
    db.refresh(prop)
    return PropertyResponse(
        id=prop.id,
        name=prop.name,
        location=prop.location,
        property_type=prop.property_type,
        purchase_date=prop.purchase_date,
        purchase_price=prop.purchase_price,
        current_value=prop.current_value,
        currency=prop.currency,
        rental_income=prop.rental_income,
        coupon_rate=prop.coupon_rate,
        notes=prop.notes,
    )


@router.delete("/{property_id}")
async def delete_property(property_id: int, db: Session = Depends(get_db)):
    """Delete a property"""
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    db.delete(prop)
    db.commit()
    return {"message": f"Property {property_id} deleted"}
