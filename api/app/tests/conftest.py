import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

from app.db.database import Base, get_db
from app.main import app

load_dotenv()

# Use PostgreSQL test database on port 15432
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:15432/model_providers"

# Create test engine with PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    # Create the database tables
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Initialize pgvector extension
    with engine.connect() as connection:
        connection.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        connection.commit()
    
    # Create a new session for the test
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        
    # Drop the database tables after the test is complete
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    # Override the get_db dependency to use the test database
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    from fastapi.testclient import TestClient
    with TestClient(app) as client:
        yield client
    
    # Remove the override after the test
    app.dependency_overrides = {}