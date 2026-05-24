from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import settings

# SQLCipher connection string with encryption
# Format: sqlite+pysqlcipher:///:memory:?cipher=aes256
DATABASE_URL = f"sqlite+pysqlcipher:///{settings.DATABASE_PATH}?cipher=aes256"

engine = create_engine(
    DATABASE_URL,
    connect_args={"timeout": 10},
    echo=settings.DEBUG,
)

# Set the encryption key for SQLCipher
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    cursor = dbapi_conn.cursor()
    # Set the encryption key
    cursor.execute(f"PRAGMA key = '{settings.DATABASE_PASSWORD}'")
    # Set other useful pragmas
    cursor.execute("PRAGMA foreign_keys = ON")
    cursor.execute("PRAGMA journal_mode = WAL")  # Write-ahead logging for better concurrency
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for FastAPI to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """Create all tables from models"""
    Base.metadata.create_all(bind=engine)
