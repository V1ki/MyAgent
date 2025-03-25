from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from uuid import UUID

from app.models.provider import Model, ModelImplementation
from app.models.schemas import ModelCreate, ModelUpdate, ModelImplementationCreate, ModelImplementationUpdate

class ModelService:
    @staticmethod
    def get_models(db: Session, skip: int = 0, limit: int = 100) -> List[Model]:
        """Get all models with pagination."""
        return db.query(Model).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_model(db: Session, model_id: UUID) -> Optional[Model]:
        """Get a specific model by ID."""
        return db.query(Model).filter(Model.id == model_id).first()
    
    @staticmethod
    def get_model_by_name(db: Session, name: str) -> Optional[Model]:
        """Get a specific model by name."""
        return db.query(Model).filter(Model.name == name).first()
    
    @staticmethod
    def create_model(db: Session, model: ModelCreate) -> Model:
        """Create a new model."""
        db_model = Model(
            name=model.name,
            description=model.description,
            capabilities=model.capabilities,
            family=model.family
        )
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model
    
    @staticmethod
    def update_model(db: Session, model_id: UUID, model: ModelUpdate) -> Optional[Model]:
        """Update an existing model."""
        db_model = ModelService.get_model(db, model_id)
        if db_model is None:
            return None
            
        update_data = model.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_model, key, value)
            
        db.commit()
        db.refresh(db_model)
        return db_model
    
    @staticmethod
    def delete_model(db: Session, model_id: UUID) -> bool:
        """Delete a model and all its implementations."""
        db_model = ModelService.get_model(db, model_id)
        if db_model is None:
            return False
            
        db.delete(db_model)
        db.commit()
        return True

class ModelImplementationService:
    @staticmethod
    def get_implementations(db: Session, skip: int = 0, limit: int = 100) -> List[ModelImplementation]:
        """Get all model implementations with pagination."""
        return db.query(ModelImplementation).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_implementation(db: Session, implementation_id: UUID) -> Optional[ModelImplementation]:
        """Get a specific model implementation by ID."""
        return db.query(ModelImplementation).filter(ModelImplementation.id == implementation_id).first()
    
    @staticmethod
    def get_model_implementations(db: Session, model_id: str) -> List[ModelImplementation]:
        """Get all implementations for a specific model."""
        return db.query(ModelImplementation).filter(ModelImplementation.model_id == model_id).order_by(ModelImplementation.sort_order).all()
    
    @staticmethod
    def create_implementation(db: Session, implementation: ModelImplementationCreate) -> ModelImplementation:
        """Create a new model implementation."""
        # Get the highest sort_order for the model
        highest_sort = db.query(ModelImplementation).filter(
            ModelImplementation.model_id == implementation.model_id
        ).order_by(ModelImplementation.sort_order.desc()).first()
        
        next_sort_order = (highest_sort.sort_order + 1) if highest_sort else 0
        
        db_implementation = ModelImplementation(
            provider_id=implementation.provider_id,
            model_id=implementation.model_id,
            provider_model_id=implementation.provider_model_id,
            version=implementation.version,
            context_window=implementation.context_window,
            pricing_info=implementation.pricing_info,
            is_available=implementation.is_available,
            custom_parameters=implementation.custom_parameters,
            sort_order=next_sort_order
        )
        db.add(db_implementation)
        db.commit()
        db.refresh(db_implementation)
        return db_implementation
    
    @staticmethod
    def update_implementation_orders(db: Session, orders: Dict[str, int]) -> bool:
        """Update sort orders for multiple implementations."""
        try:
            for impl_id, order in orders.items():
                implementation = db.query(ModelImplementation).filter(
                    ModelImplementation.id == impl_id
                ).first()
                
                if implementation:
                    implementation.sort_order = order
            
            db.commit()
            return True
        except Exception as e:
            db.rollback()
            print(f"Error updating implementation orders: {e}")
            return False
    
    @staticmethod
    def update_implementation(
        db: Session, 
        implementation_id: UUID, 
        implementation: ModelImplementationUpdate
    ) -> Optional[ModelImplementation]:
        """Update an existing model implementation."""
        db_implementation = ModelImplementationService.get_implementation(db, implementation_id)
        if db_implementation is None:
            return None
            
        update_data = implementation.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_implementation, key, value)
            
        db.commit()
        db.refresh(db_implementation)
        return db_implementation
    
    @staticmethod
    def delete_implementation(db: Session, implementation_id: UUID) -> bool:
        """Delete a model implementation."""
        db_implementation = ModelImplementationService.get_implementation(db, implementation_id)
        if db_implementation is None:
            return False
            
        db.delete(db_implementation)
        db.commit()
        return True