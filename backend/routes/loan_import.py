"""
Loan Import API - Import loans from amortization schedule PDFs
"""

import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.db import Loan
from backend.services.loan_importer import get_available_loans

logger = logging.getLogger(__name__)

router = APIRouter()


def convert_loan_data_to_db(loan_data: dict) -> dict:
    """Convert loan data with string dates to DB-compatible format with date objects"""
    converted = loan_data.copy()
    for date_field in ["start_date", "end_date", "next_payment_date"]:
        if date_field in converted and isinstance(converted[date_field], str):
            converted[date_field] = datetime.fromisoformat(converted[date_field]).date()
    return converted


@router.get("/available")
async def get_available_loan_sources():
    """Get list of available amortization PDF schedules"""
    try:
        loans = get_available_loans()
        return {
            "count": len(loans),
            "loans": loans,
        }
    except Exception as e:
        logger.error(f"Error getting available loans: {e}")
        return {"count": 0, "loans": [], "error": str(e)}


@router.post("/import-from-pdf/{property_name}")
async def import_loan_from_pdf(property_name: str, db: Session = Depends(get_db)):
    """Import a loan from amortization PDF by property name"""
    try:
        loans = get_available_loans()
        loan_data = None

        # Find the loan matching the property name
        for loan in loans:
            if loan["property_name"].lower() == property_name.lower():
                loan_data = loan
                break

        if not loan_data:
            raise HTTPException(
                status_code=404,
                detail=f"No amortization schedule found for {property_name}",
            )

        # Check if loan already exists
        existing = (
            db.query(Loan).filter(Loan.name == loan_data["name"]).first()
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Loan '{loan_data['name']}' already exists",
            )

        # Convert date strings to date objects
        converted_data = convert_loan_data_to_db(loan_data)

        # Create new loan record
        new_loan = Loan(
            name=converted_data["name"],
            loan_type=converted_data["loan_type"],
            original_amount=converted_data["original_amount"],
            original_currency=converted_data["original_currency"],
            principal_left=converted_data["principal_left"],
            next_payment_amount=converted_data["next_payment_amount"],
            next_payment_date=converted_data["next_payment_date"],
            interest_rate=converted_data["interest_rate"],
            payment_frequency=converted_data["payment_frequency"],
            start_date=converted_data["start_date"],
            end_date=converted_data["end_date"],
            notes=converted_data["notes"],
        )

        db.add(new_loan)
        db.commit()
        db.refresh(new_loan)

        return {
            "success": True,
            "message": f"Successfully imported loan: {new_loan.name}",
            "loan": {
                "id": new_loan.id,
                "name": new_loan.name,
                "original_amount": new_loan.original_amount,
                "principal_left": new_loan.principal_left,
            },
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error importing loan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import-all")
async def import_all_loans_from_pdfs(db: Session = Depends(get_db)):
    """Import all available loans from amortization PDFs"""
    imported = []
    errors = []

    try:
        loans = get_available_loans()

        for loan_data in loans:
            try:
                # Check if already exists
                existing = (
                    db.query(Loan).filter(Loan.name == loan_data["name"]).first()
                )
                if existing:
                    errors.append(f"Loan '{loan_data['name']}' already exists")
                    continue

                # Convert date strings to date objects
                converted_data = convert_loan_data_to_db(loan_data)

                # Create new loan
                new_loan = Loan(
                    name=converted_data["name"],
                    loan_type=converted_data["loan_type"],
                    original_amount=converted_data["original_amount"],
                    original_currency=converted_data["original_currency"],
                    principal_left=converted_data["principal_left"],
                    next_payment_amount=converted_data["next_payment_amount"],
                    next_payment_date=converted_data["next_payment_date"],
                    interest_rate=converted_data["interest_rate"],
                    payment_frequency=converted_data["payment_frequency"],
                    start_date=converted_data["start_date"],
                    end_date=converted_data["end_date"],
                    notes=converted_data["notes"],
                )

                db.add(new_loan)
                imported.append(loan_data["name"])

            except Exception as e:
                errors.append(f"Error importing {loan_data['name']}: {str(e)}")

        db.commit()

        return {
            "success": len(imported) > 0,
            "imported_count": len(imported),
            "imported_loans": imported,
            "errors": errors,
            "message": f"Imported {len(imported)} loans" + (
                f" with {len(errors)} errors" if errors else ""
            ),
        }

    except Exception as e:
        logger.error(f"Error importing all loans: {e}")
        raise HTTPException(status_code=500, detail=str(e))
