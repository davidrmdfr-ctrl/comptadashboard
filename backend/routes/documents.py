"""
Documents API - serves amortization schedules and other PDFs
"""

import os
from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter()

DATA_DIR = Path("Data")

@router.get("/loan-documents")
async def get_loan_documents():
    """List available loan amortization PDF documents"""
    if not DATA_DIR.exists():
        return {"documents": []}

    # Find all amortissement PDFs
    documents = []
    for file in DATA_DIR.glob("*.pdf"):
        if "amortissement" in file.name.lower():
            # Extract property name from filename
            # "Tableau amortissement Roses.pdf" -> "Roses"
            name = file.name.replace("Tableau amortissement ", "").replace(".pdf", "")
            documents.append({
                "name": name,
                "filename": file.name,
                "path": f"/loan-documents/{file.name}",
                "type": "amortissement"
            })

    return {"documents": sorted(documents, key=lambda x: x["name"])}


@router.get("/{filename}")
async def get_document(filename: str):
    """Serve a document file"""
    # Security: ensure filename is valid
    if ".." in filename or filename.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid filename")

    file_path = DATA_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Document not found")

    # Check if it's a PDF in the Data folder
    if not filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    # Return the file
    from fastapi.responses import FileResponse
    return FileResponse(file_path, media_type="application/pdf")
