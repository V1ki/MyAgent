from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.db.database import get_db
from app.models.schemas import (
    ModelCreate, ModelRead, ModelDetailedRead, ModelUpdate, ModelListRead, 
    ModelImplementationCreate, ModelImplementationRead, ModelImplementationUpdate
)
from app.services.model_service import ModelService, ModelImplementationService

router = APIRouter(prefix="/models", tags=["models"])

@router.get("/", response_model=List[ModelListRead])
def get_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all models with pagination and implementation counts."""
    models = ModelService.get_models(db, skip=skip, limit=limit)
    
    # Transform the models to include implementation count
    result = []
    for model in models:
        model_data = ModelListRead.model_validate(model)
        model_data.implementations_count = len(model.implementations)
        result.append(model_data)
    
    return result

@router.get("/{model_id}", response_model=ModelDetailedRead)
def get_model(
    model_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific model by ID, including its implementations."""
    model = ModelService.get_model(db, model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with ID {model_id} not found"
        )
    
    return ModelDetailedRead.model_validate(model)

@router.post("/", response_model=ModelRead, status_code=status.HTTP_201_CREATED)
def create_model(
    model: ModelCreate,
    db: Session = Depends(get_db)
):
    """Create a new model."""
    # Check if a model with the same name already exists
    existing_model = ModelService.get_model_by_name(db, model.name)
    if existing_model:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Model with name '{model.name}' already exists"
        )
        
    return ModelService.create_model(db, model)

@router.put("/{model_id}", response_model=ModelRead)
def update_model(
    model_id: UUID,
    model: ModelUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing model."""
    # Check if the model exists
    db_model = ModelService.get_model(db, model_id)
    if db_model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with ID {model_id} not found"
        )
    
    # Check if updating name to one that already exists
    if model.name is not None and model.name != db_model.name:
        existing_model = ModelService.get_model_by_name(db, model.name)
        if existing_model and existing_model.id != model_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Model with name '{model.name}' already exists"
            )
    
    updated_model = ModelService.update_model(db, model_id, model)
    return updated_model

@router.delete("/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_model(
    model_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a model and all associated implementations."""
    # Check if the model exists
    db_model = ModelService.get_model(db, model_id)
    if db_model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with ID {model_id} not found"
        )
    
    success = ModelService.delete_model(db, model_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete model"
        )
    
    return None  # 204 No Content response doesn't include a body

@router.get("/{model_id}/implementations", response_model=List[ModelImplementationRead])
def get_model_implementations(
    model_id: str,
    db: Session = Depends(get_db)
):
    """Get all implementations for a specific model."""
    implementations = ModelImplementationService.get_model_implementations(db, model_id)
    return implementations

@router.post("/{model_id}/implementations", response_model=ModelImplementationRead, status_code=status.HTTP_201_CREATED)
def create_model_implementation(
    model_id: str,
    implementation: ModelImplementationCreate,
    db: Session = Depends(get_db)
):
    """Create a new model implementation."""
    # Verify model exists
    model = ModelService.get_model(db, model_id)
    if model is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model with ID {model_id} not found"
        )
    
    # Set the model_id in the implementation data
    implementation_data = implementation.model_dump()
    implementation_data["model_id"] = model_id
    
    return ModelImplementationService.create_implementation(db, ModelImplementationCreate(**implementation_data))

@router.get("/implementations/{implementation_id}", response_model=ModelImplementationRead)
def get_implementation(
    implementation_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific model implementation by ID."""
    implementation = ModelImplementationService.get_implementation(db, implementation_id)
    if implementation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model implementation with ID {implementation_id} not found"
        )
    return implementation

@router.put("/implementations/{implementation_id}", response_model=ModelImplementationRead)
def update_implementation(
    implementation_id: UUID,
    implementation: ModelImplementationUpdate,
    db: Session = Depends(get_db)
):
    """Update an existing model implementation."""
    # Check if implementation exists
    db_implementation = ModelImplementationService.get_implementation(db, implementation_id)
    if db_implementation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model implementation with ID {implementation_id} not found"
        )
    
    updated_implementation = ModelImplementationService.update_implementation(
        db,
        implementation_id,
        implementation
    )
    return updated_implementation

@router.delete("/implementations/{implementation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_implementation(
    implementation_id: UUID,
    db: Session = Depends(get_db)
):
    """Delete a model implementation."""
    # Check if implementation exists
    db_implementation = ModelImplementationService.get_implementation(db, implementation_id)
    if db_implementation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model implementation with ID {implementation_id} not found"
        )
    
    success = ModelImplementationService.delete_implementation(db, implementation_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete model implementation"
        )
    
    return None  # 204 No Content response doesn't include a body