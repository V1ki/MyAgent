from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.routers import providers, api_keys
from app.db.database import init_pgvector

app = FastAPI(
    title="Model Providers API",
    description="API for managing model providers and API keys",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; in production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize pgvector extension
@app.on_event("startup")
async def startup_event():
    try:
        init_pgvector()
    except Exception as e:
        print(f"Warning: Failed to initialize pgvector extension: {e}")
        # Continue anyway, as this might be a test environment

# Include routers
app.include_router(providers.router)
app.include_router(api_keys.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Model Providers API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}