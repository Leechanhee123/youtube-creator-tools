from fastapi import APIRouter, HTTPException
from typing import Optional
import logging
from pydantic import BaseModel

from src.services.seo_analyzer import SEOAnalyzer
from src.services.youtube_data_api import YouTubeDataAPIService
from src.models.seo_config_models import ChannelType, get_default_seo_config

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/seo", tags=["Backlinko SEO Analysis"])

class SEOAnalysisRequest(BaseModel):
    """SEO 분석 요청"""
    channel_id: str
    force_channel_type: Optional[ChannelType] = None
    max_videos: int = 50

# 서비스 인스턴스
youtube_service = YouTubeDataAPIService()

@router.post("/analyze")
async def analyze_channel_seo(request: SEOAnalysisRequest):
    """
    Backlinko 방법론 기반 YouTube 채널 SEO 분석
    
    - **channel_id**: 분석할 YouTube 채널 ID
    - **force_channel_type**: 강제 채널 타입 설정 (선택적)
    - **max_videos**: 분석할 최대 비디오 수 (기본값: 50개)
    """
    try:
        logger.info(f"Starting Backlinko SEO analysis for channel: {request.channel_id}")
        
        # 1. 채널 비디오 데이터 수집
        videos_data = await youtube_service.get_channel_videos(
            channel_id=request.channel_id,
            max_results=request.max_videos,
            order='date'
        )
        
        if not videos_data.get('success') or not videos_data.get('data', {}).get('videos'):
            raise HTTPException(
                status_code=404,
                detail="채널의 비디오를 찾을 수 없습니다."
            )
        
        videos = videos_data['data']['videos']
        
        # 2. Backlinko SEO 분석 실행
        seo_analyzer = SEOAnalyzer()
        analysis_result = seo_analyzer.analyze_comprehensive_seo(
            videos=videos,
            force_channel_type=request.force_channel_type
        )
        
        if not analysis_result.get('success'):
            raise HTTPException(
                status_code=400,
                detail=analysis_result.get('message', 'SEO 분석에 실패했습니다.')
            )
        
        logger.info(f"Backlinko SEO analysis completed for channel: {request.channel_id}")
        
        return {
            'success': True,
            'message': f'Backlinko 기반 SEO 분석이 완료되었습니다. ({len(videos)}개 비디오 분석)',
            'data': analysis_result['data']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SEO analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"SEO 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/config")
async def get_seo_config():
    """SEO 분석 설정 반환"""
    try:
        config = get_default_seo_config()
        return {
            'success': True,
            'message': 'SEO 분석 설정을 반환했습니다.',
            'data': {
                'config': config,
                'analysis_method': 'backlinko_advanced',
                'supported_channel_types': [e.value for e in ChannelType]
            }
        }
    except Exception as e:
        logger.error(f"Failed to get SEO config: {str(e)}")
        raise HTTPException(status_code=500, detail=f"설정 조회 실패: {str(e)}")

@router.get("/benchmarks/{channel_type}")
async def get_channel_benchmarks(channel_type: ChannelType):
    """채널 타입별 SEO 벤치마크 반환"""
    try:
        analyzer = SEOAnalyzer()
        benchmarks = analyzer._get_channel_benchmarks(channel_type)
        
        return {
            'success': True,
            'message': f'{channel_type.value} 채널의 SEO 벤치마크를 반환했습니다.',
            'data': {
                'channel_type': channel_type.value,
                'benchmarks': benchmarks,
                'analysis_method': 'backlinko_advanced'
            }
        }
    except Exception as e:
        logger.error(f"Failed to get benchmarks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"벤치마크 조회 실패: {str(e)}")