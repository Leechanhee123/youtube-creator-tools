from fastapi import APIRouter, HTTPException
from src.core.database import supabase_client
from src.api.youtube_routes import router as youtube_router
from src.api.processor_routes import router as processor_router
from src.api.youtube_data_routes import router as youtube_data_router
from src.api.seo_routes import router as seo_router
from src.api.competitor_routes import router as competitor_router
from src.api.performance_routes import router as performance_router

router = APIRouter()

# YouTube Comment Downloader 라우터 포함
router.include_router(youtube_router)

# Comment Processor 라우터 포함
router.include_router(processor_router)

# YouTube Data API 라우터 포함
router.include_router(youtube_data_router)

# SEO Analysis 라우터 포함
router.include_router(seo_router)

# Competitor Analysis 라우터 포함
router.include_router(competitor_router)

# Performance Analysis 라우터 포함
router.include_router(performance_router)


@router.get("/test")
async def test_endpoint():
    return {"message": "Test endpoint working"}

@router.get("/status")
async def status():
    return {"status": "API is running"}

@router.get("/db-test")
async def test_database():
    try:
        client = supabase_client.get_client()
        return {"message": "Database connection successful", "status": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

