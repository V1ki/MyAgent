"""
Database initialization script that populates default data
"""
from sqlalchemy.orm import Session
import logging
from app.models.conversation import ParameterPreset
from uuid import uuid4

logger = logging.getLogger(__name__)

def create_default_parameter_presets(db: Session):
    """Create default parameter presets for various use cases"""
    
    presets = [
        {
            "name": "标准设置",
            "description": "适合一般对话的平衡设置",
            "parameters": {
                "temperature": 0.7,
                "top_p": 1.0,
                "max_tokens": 1000,
                "presence_penalty": 0.0,
                "frequency_penalty": 0.0
            }
        },
        {
            "name": "创意模式",
            "description": "增加多样性和创造力的设置",
            "parameters": {
                "temperature": 1.2,
                "top_p": 0.9,
                "max_tokens": 1000,
                "presence_penalty": 0.2,
                "frequency_penalty": 0.2
            }
        },
        {
            "name": "精确模式",
            "description": "更确定和一致性的回答",
            "parameters": {
                "temperature": 0.2,
                "top_p": 0.9,
                "max_tokens": 1000,
                "presence_penalty": 0.0,
                "frequency_penalty": 0.3
            }
        },
        {
            "name": "编程助手",
            "description": "适合编程相关的任务",
            "parameters": {
                "temperature": 0.3,
                "top_p": 0.95,
                "max_tokens": 2000,
                "presence_penalty": 0.0,
                "frequency_penalty": 0.1
            }
        }
    ]

    # Check if presets already exist before creating
    existing_preset_count = db.query(ParameterPreset).count()
    if existing_preset_count > 0:
        logger.info(f"Found {existing_preset_count} existing parameter presets, skipping creation.")
        return

    # Create the presets
    for preset_data in presets:
        preset = ParameterPreset(
            id=uuid4(),
            name=preset_data["name"],
            description=preset_data["description"],
            parameters=preset_data["parameters"]
        )
        db.add(preset)
    
    db.commit()
    logger.info(f"Created {len(presets)} default parameter presets")

def initialize_database(db: Session):
    """Initialize the database with required default data"""
    logger.info("Initializing database with default data")
    create_default_parameter_presets(db)
    logger.info("Database initialization complete")