from fastapi import APIRouter, HTTPException, Query
from src.services.youtube_data_api import YouTubeDataAPIService
from src.models.youtube_data_models import (
    ChannelInfoRequest,
    ChannelVideosRequest,
    VideoStatisticsRequest,
    ChannelSearchRequest,
    ChannelInfoResponse,
    ChannelVideosResponse,
    VideoStatisticsResponse,
    ChannelSearchResponse,
    APITestResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/youtube-data", tags=["YouTube Data API"])

# 서비스 인스턴스
youtube_service = YouTubeDataAPIService()

@router.post("/channel/info", response_model=ChannelInfoResponse)
async def get_channel_info(request: ChannelInfoRequest):
    """
    YouTube 채널 정보를 조회합니다.
    
    - **channel_id**: 채널 ID (UCxxxxxx 형식)
    - **username**: 사용자명 (@username 형식)  
    - **handle**: 핸들 (@handle 형식)
    
    셋 중 하나는 반드시 제공되어야 합니다.
    """
    try:
        result = await youtube_service.get_channel_info(
            channel_id=request.channel_id,
            username=request.username,
            handle=request.handle,
            url=request.url
        )
        
        return ChannelInfoResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting channel info: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/channel/info")
async def get_channel_info_query(
    channel_id: str = Query(None, description="채널 ID"),
    username: str = Query(None, description="사용자명"),
    handle: str = Query(None, description="핸들"),
    url: str = Query(None, description="YouTube 채널 URL")
):
    """
    YouTube 채널 정보를 쿼리 파라미터로 조회합니다.
    """
    if not any([channel_id, username, handle, url]):
        raise HTTPException(
            status_code=400, 
            detail="At least one of channel_id, username, handle, or url must be provided"
        )
    
    try:
        result = await youtube_service.get_channel_info(
            channel_id=channel_id,
            username=username,
            handle=handle,
            url=url
        )
        
        return ChannelInfoResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting channel info: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/channel/videos", response_model=ChannelVideosResponse)
async def get_channel_videos(request: ChannelVideosRequest):
    """
    채널의 비디오 목록을 조회합니다.
    
    - **channel_id**: 채널 ID (필수)
    - **max_results**: 최대 결과 수 (1-50, 기본값: 50)
    - **order**: 정렬 순서 (date, rating, relevance, title, videoCount, viewCount)
    """
    try:
        result = await youtube_service.get_channel_videos(
            channel_id=request.channel_id,
            max_results=request.max_results,
            order=request.order
        )
        
        return ChannelVideosResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting channel videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/channel/{channel_id}/videos")
async def get_channel_videos_path(
    channel_id: str,
    max_results: int = Query(50, ge=1, le=50, description="최대 결과 수"),
    order: str = Query("date", description="정렬 순서")
):
    """
    채널의 비디오 목록을 경로 파라미터로 조회합니다.
    """
    try:
        result = await youtube_service.get_channel_videos(
            channel_id=channel_id,
            max_results=max_results,
            order=order
        )
        
        return ChannelVideosResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting channel videos: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/video/statistics", response_model=VideoStatisticsResponse)
async def get_video_statistics(request: VideoStatisticsRequest):
    """
    비디오의 상세 통계 정보를 조회합니다.
    
    - **video_id**: 비디오 ID (필수)
    """
    try:
        result = await youtube_service.get_video_statistics(request.video_id)
        
        return VideoStatisticsResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting video statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/video/{video_id}/statistics")
async def get_video_statistics_path(video_id: str):
    """
    비디오의 상세 통계 정보를 경로 파라미터로 조회합니다.
    """
    try:
        result = await youtube_service.get_video_statistics(video_id)
        
        return VideoStatisticsResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting video statistics: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/channels/search", response_model=ChannelSearchResponse)
async def search_channels(request: ChannelSearchRequest):
    """
    채널을 검색합니다.
    
    - **query**: 검색어 (필수)
    - **max_results**: 최대 결과 수 (1-50, 기본값: 25)
    """
    try:
        result = await youtube_service.search_channels(
            query=request.query,
            max_results=request.max_results
        )
        
        return ChannelSearchResponse(**result)
        
    except Exception as e:
        logger.error(f"Error searching channels: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/channels/search")
async def search_channels_query(
    q: str = Query(..., description="검색어"),
    max_results: int = Query(25, ge=1, le=50, description="최대 결과 수")
):
    """
    채널을 쿼리 파라미터로 검색합니다.
    """
    try:
        result = await youtube_service.search_channels(
            query=q,
            max_results=max_results
        )
        
        return ChannelSearchResponse(**result)
        
    except Exception as e:
        logger.error(f"Error searching channels: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/categories")
async def get_video_categories(region: str = Query(default="KR", description="지역 코드 (KR, US 등)")):
    """
    YouTube 비디오 카테고리 목록을 조회합니다.
    
    - **region**: 지역 코드 (기본값: KR)
    """
    try:
        result = await youtube_service.get_video_categories(region=region)
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
            
        return {
            'success': True,
            'message': result['message'],
            'data': result['data']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get video categories: {str(e)}")
        raise HTTPException(status_code=500, detail=f"카테고리 조회 실패: {str(e)}")

@router.get("/channels/search-by-topic")
async def search_channels_by_topic(
    topics: str = Query(description="검색할 주제 키워드 (쉼표로 구분)"),
    max_results: int = Query(default=25, ge=1, le=50, description="최대 결과 수"),
    region: str = Query(default="KR", description="지역 코드")
):
    """
    주제 키워드로 채널을 검색합니다.
    
    - **topics**: 검색할 주제 키워드 (예: "게임,리뷰" 또는 "music,entertainment")
    - **max_results**: 최대 결과 수 (1-50)
    - **region**: 지역 코드 (기본값: KR)
    """
    try:
        # 쉼표로 구분된 키워드를 리스트로 변환
        topic_keywords = [topic.strip() for topic in topics.split(',') if topic.strip()]
        
        if not topic_keywords:
            raise HTTPException(status_code=400, detail="최소 하나의 주제 키워드가 필요합니다.")
        
        result = await youtube_service.search_channels_by_topic(
            topic_keywords=topic_keywords,
            max_results=max_results,
            region=region
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
            
        return {
            'success': True,
            'message': result['message'],
            'data': result['data']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search channels by topic: {str(e)}")
        raise HTTPException(status_code=500, detail=f"주제별 채널 검색 실패: {str(e)}")

@router.get("/test", response_model=APITestResponse)
async def test_api_connection():
    """
    YouTube Data API 연결을 테스트합니다.
    API 키가 유효한지 확인하고 기본적인 연결 상태를 점검합니다.
    """
    try:
        result = await youtube_service.test_api_connection()
        
        return APITestResponse(**result)
        
    except Exception as e:
        logger.error(f"Error testing API connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def youtube_data_health_check():
    """YouTube Data API 서비스 상태 확인"""
    try:
        # API 연결 테스트
        test_result = await youtube_service.test_api_connection()
        
        return {
            "status": "healthy" if test_result['success'] else "unhealthy",
            "service": "YouTube Data API",
            "message": test_result['message'],
            "api_key_configured": youtube_service.api_key is not None,
            "api_key_status": test_result.get('api_key_status', 'unknown')
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "service": "YouTube Data API", 
            "message": f"Health check failed: {str(e)}",
            "api_key_configured": youtube_service.api_key is not None,
            "api_key_status": "unknown"
        }