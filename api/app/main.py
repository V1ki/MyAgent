from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import providers, api_keys, models, free_quotas
from app.db.database import init_pgvector, SessionLocal

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    try:
        init_pgvector()
        
    except Exception as e:
        print(f"Warning: Failed to initialize database: {e}")
        
    yield
    # Shutdown tasks (if any) can be added here

app.router.lifespan_context = lifespan
    
# Include routers
app.include_router(providers.router)
app.include_router(api_keys.router)
app.include_router(models.router)
app.include_router(free_quotas.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the Model Providers API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}