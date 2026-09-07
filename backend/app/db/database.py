import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

def _get_db_path() -> str:
    # If explicitly in serverless or directory is not writable, use /tmp
    db_dir = os.path.dirname(os.path.abspath(__file__))
    is_serverless = bool(
        os.environ.get("VERCEL")
        or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")
        or os.environ.get("LAMBDA_TASK_ROOT")
        or not os.access(db_dir, os.W_OK)
    )
    if is_serverless:
        tmp_db = "/tmp/heartbeat360.db"
        orig_db = os.path.join(db_dir, "heartbeat360.db")
        if os.path.exists(orig_db) and not os.path.exists(tmp_db):
            try:
                shutil.copyfile(orig_db, tmp_db)
            except Exception:
                pass
        return tmp_db
    return os.path.join(db_dir, "heartbeat360.db")

DB_PATH = _get_db_path()
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
