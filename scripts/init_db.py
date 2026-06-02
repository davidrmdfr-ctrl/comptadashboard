#!/usr/bin/env python3
"""
Initialize the database and import data from Compta.xlsx

Usage:
    python init_db.py
"""

import sys
import os
from pathlib import Path
import secrets
import logging

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def main():
    # Add backend to path
    backend_dir = Path(__file__).parent
    sys.path.insert(0, str(backend_dir))

    # Check if .env exists
    env_file = Path(__file__).parent / ".env"
    if not env_file.exists():
        logger.info("Creating .env file...")
        # Generate a secure random password
        db_password = secrets.token_urlsafe(32)

        env_content = f"""# Database
DATABASE_PASSWORD={db_password}
DATABASE_PATH=./Data/portfolio.db

# API Keys (optional, for future enhancements)
ALPHA_VANTAGE_KEY=
COINGECKO_KEY=

# Server
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Environment
DEBUG=False
ENVIRONMENT=development
"""
        env_file.write_text(env_content)
        logger.info(f"✓ Created .env with secure password")
        logger.info(f"  Password: {db_password}")
    else:
        logger.info(".env already exists")

    # Check if Compta.xlsx exists
    excel_file = Path(__file__).parent / "Data" / "Compta.xlsx"
    if not excel_file.exists():
        logger.error(f"Excel file not found: {excel_file}")
        logger.error("Make sure Compta.xlsx is in the Data/ folder")
        return 1

    logger.info(f"Found Excel file: {excel_file}")

    # Import the importer
    try:
        from backend.migrations.import_compta import ComptaImporter
    except ImportError as e:
        logger.error(f"Failed to import: {e}")
        return 1

    # Run import
    logger.info("\nStarting database initialization...")
    importer = ComptaImporter(str(excel_file))
    try:
        importer.import_all()
        logger.info("\n✓ Database initialized successfully!")
        logger.info(f"  Database: ./Data/portfolio.db")
        logger.info("  Next: Run the FastAPI server")
        logger.info("  $ uvicorn backend.main:app --reload")
        return 0
    except Exception as e:
        logger.error(f"✗ Initialization failed: {e}")
        import traceback
        traceback.print_exc()
        return 1
    finally:
        importer.close()

if __name__ == "__main__":
    sys.exit(main())
