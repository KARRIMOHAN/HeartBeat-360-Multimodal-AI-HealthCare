import os
import shutil
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/heartbeat360.db"
    orig_db = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heartbeat360.db")
    if os.path.exists(orig_db) and not os.path.exists(DB_PATH):
        try:
            shutil.copyfile(orig_db, DB_PATH)
        except Exception:
            pass
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "heartbeat360.db")

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
