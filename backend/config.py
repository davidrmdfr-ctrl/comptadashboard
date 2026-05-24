import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings:
    # Database
    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD", "changeme")
    DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./Data/portfolio.db")

    # Ensure Data directory exists
    DATABASE_DIR = Path(DATABASE_PATH).parent
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)

    # Server
    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))

    # Environment
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # API Keys
    ALPHA_VANTAGE_KEY: str = os.getenv("ALPHA_VANTAGE_KEY", "")
    COINGECKO_KEY: str = os.getenv("COINGECKO_KEY", "")

settings = Settings()
