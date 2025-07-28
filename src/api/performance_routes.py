from fastapi import APIRouter, HTTPException
from src.services.channel_performance_analyzer import ChannelPerformanceAnalyzer
from src.services.youtube_data_api import YouTubeDataAPIService
from pydantic import BaseModel
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/performance", tags=["Channel Performance"])

# 서비스 인스턴스
performance_analyzer = ChannelPerformanceAnalyzer()
youtube_service = YouTubeDataAPIService()

class ChannelPerformanceRequest(BaseModel):
    """채널 성과 분석 요청 모델"""
    channel_id: str = None
    url: str = None
    username: str = None
    handle: str = None
    analysis_value: int = 10  # 분석할 비디오 개수

class ChannelPerformanceResponse(BaseModel):
    """채널 성과 분석 응답 모델"""
    success: bool
    message: str
    data: Dict[str, Any]

@router.post("/comprehensive-analysis", response_model=ChannelPerformanceResponse)
async def get_comprehensive_performance_analysis(request: ChannelPerformanceRequest):
    """
    채널의 종합적인 성과 분석을 수행합니다.
    
    다음 메트릭들을 종합하여 분석합니다:
    - 최근 성과 (40%): 최신 영상들의 구독자 대비 조회수
    - 비디오 품질 (30%): 조회수와 참여도 기반 품질 점수
    - 콘텐츠 일관성 (20%): 업로드 스케줄의 일관성
    - 참여도 (10%): 좋아요 및 댓글 비율
    
    분석할 비디오 개수를 선택할 수 있습니다 (5~50개).
    """
    try:
        # 먼저 채널 기본 정보 가져오기
        channel_info = await youtube_service.get_channel_info(
            channel_id=request.channel_id,
            username=request.username,
            handle=request.handle,
            url=request.url
        )
        
        if not channel_info.get('success'):
            raise HTTPException(
                status_code=404, 
                detail=f"채널을 찾을 수 없습니다: {channel_info.get('message', 'Unknown error')}"
            )
        
        channel_data = channel_info.get('data')
        
        # 종합 성과 분석 수행
        performance_result = await performance_analyzer.calculate_comprehensive_metrics(
            channel_data, 
            analysis_type="count",
            analysis_value=request.analysis_value
        )
        
        if not performance_result.get('success'):
            return ChannelPerformanceResponse(
                success=False,
                message=performance_result.get('message', '성과 분석 실패'),
                data=performance_result.get('data', {})
            )
        
        # 응답 데이터 구성
        response_data = {
            'channel_info': {
                'channel_id': channel_data.get('channel_id'),
                'title': channel_data.get('title'),
                'subscriber_count': channel_data.get('statistics', {}).get('subscriber_count'),
                'view_count': channel_data.get('statistics', {}).get('view_count'),
                'video_count': channel_data.get('statistics', {}).get('video_count')
            },
            'performance_analysis': performance_result.get('data')
        }
        
        return ChannelPerformanceResponse(
            success=True,
            message="성과 분석이 완료되었습니다",
            data=response_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in comprehensive performance analysis: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"성과 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """성과 분석 서비스 상태 확인"""
    return {
        "service": "Channel Performance Analyzer",
        "status": "healthy",
        "message": "성과 분석 서비스가 정상 작동 중입니다"
    }