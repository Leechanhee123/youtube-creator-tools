from fastapi import APIRouter, HTTPException, Depends
from src.services.seo_analyzer import SEOAnalyzer
from src.services.youtube_data_api import YouTubeDataAPIService
from src.models.seo_models import (
    SEOAnalysisRequest,
    SEOAnalysisResponse,
    ChannelSEOSummary
)
from typing import List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/seo", tags=["SEO Analysis"])

# 서비스 인스턴스
seo_analyzer = SEOAnalyzer()
youtube_service = YouTubeDataAPIService()

@router.post("/analyze-channel", response_model=SEOAnalysisResponse)
async def analyze_channel_seo(request: SEOAnalysisRequest):
    """
    채널의 SEO 분석을 수행합니다.
    
    - **channel_id**: 분석할 YouTube 채널 ID
    - **percentile_threshold**: 상위/하위 그룹 분리 기준 (기본값: 0.2 = 상위/하위 20%)
    - **min_videos**: 분석에 필요한 최소 비디오 수 (기본값: 10개)
    """
    try:
        logger.info(f"Starting SEO analysis for channel: {request.channel_id}")
        
        # 1단계: 채널의 모든 비디오 목록 가져오기
        videos_data = await youtube_service.get_channel_videos(
            channel_id=request.channel_id,
            max_results=50,  # 한 번에 최대 50개
            order='date'
        )
        
        if not videos_data.get('success') or not videos_data.get('data', {}).get('videos'):
            raise HTTPException(
                status_code=404,
                detail="채널의 비디오를 찾을 수 없습니다."
            )
        
        all_videos = videos_data['data']['videos']
        
        # 2단계: 추가 비디오가 있다면 더 가져오기 (페이지네이션)
        next_page_token = videos_data.get('data', {}).get('next_page_token')
        while next_page_token and len(all_videos) < 200:  # 최대 200개까지
            try:
                more_videos = await youtube_service.get_channel_videos(
                    channel_id=request.channel_id,
                    max_results=50,
                    order='date',
                    page_token=next_page_token
                )
                
                if more_videos.get('success') and more_videos.get('data', {}).get('videos'):
                    all_videos.extend(more_videos['data']['videos'])
                    next_page_token = more_videos.get('data', {}).get('next_page_token')
                else:
                    break
                    
            except Exception as e:
                logger.warning(f"Failed to fetch additional videos: {str(e)}")
                break
        
        logger.info(f"Retrieved {len(all_videos)} videos for analysis")
        
        # 3단계: 각 비디오의 상세 정보 가져오기 (설명, 태그 등)
        detailed_videos = []
        for i, video in enumerate(all_videos):
            try:
                # API 호출 제한을 위해 배치 처리 (실제로는 videos.list API 사용해야 함)
                detailed_response = await youtube_service.get_video_statistics(video['video_id'])
                
                if detailed_response.get('success') and detailed_response.get('data'):
                    detailed_info = detailed_response['data']
                    # 기존 비디오 정보와 상세 정보 병합
                    merged_video = {
                        **video,
                        **detailed_info,
                        'statistics': {
                            **video.get('statistics', {}),
                            **detailed_info.get('statistics', {})
                        }
                    }
                else:
                    # 상세 정보를 가져오지 못한 경우 기본 정보 사용
                    merged_video = video
                detailed_videos.append(merged_video)
                
                # 진행 상황 로깅
                if (i + 1) % 10 == 0:
                    logger.info(f"Processed {i + 1}/{len(all_videos)} videos")
                    
            except Exception as e:
                logger.warning(f"Failed to get detailed info for video {video.get('video_id')}: {str(e)}")
                # 상세 정보를 가져오지 못해도 기본 정보로 분석 진행
                detailed_videos.append(video)
        
        logger.info(f"Completed detailed analysis for {len(detailed_videos)} videos")
        
        # 4단계: 최소 비디오 수 확인
        if len(detailed_videos) < request.min_videos:
            return SEOAnalysisResponse(
                success=False,
                message=f"SEO 분석을 위해서는 최소 {request.min_videos}개의 비디오가 필요합니다. "
                       f"현재 {len(detailed_videos)}개의 비디오만 확인되었습니다.",
                data=None
            )
        
        # 5단계: SEO 분석 수행
        analysis_result = seo_analyzer.analyze_channel_seo(
            videos=detailed_videos,
            percentile_threshold=request.percentile_threshold
        )
        
        if not analysis_result['success']:
            return SEOAnalysisResponse(
                success=False,
                message=analysis_result['message'],
                data=None
            )
        
        logger.info(f"SEO analysis completed for channel {request.channel_id}")
        
        return SEOAnalysisResponse(
            success=True,
            message=analysis_result['message'],
            data=analysis_result['data']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"SEO analysis failed for channel {request.channel_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"SEO 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/channel/{channel_id}/summary")
async def get_channel_seo_summary(channel_id: str):
    """
    채널의 SEO 요약 정보를 조회합니다.
    
    - **channel_id**: YouTube 채널 ID
    """
    try:
        # 기본 설정으로 분석 수행
        request = SEOAnalysisRequest(
            channel_id=channel_id,
            percentile_threshold=0.2,
            min_videos=10
        )
        
        analysis_response = await analyze_channel_seo(request)
        
        if not analysis_response.success or not analysis_response.data:
            return {
                'success': False,
                'message': analysis_response.message,
                'summary': None
            }
        
        data = analysis_response.data
        
        # 요약 정보 생성
        summary = ChannelSEOSummary(
            channel_id=channel_id,
            total_videos=data.total_videos,
            avg_views_top_group=data.analysis_groups['top_videos']['analysis']['statistics']['avg_views'],
            avg_views_bottom_group=data.analysis_groups['bottom_videos']['analysis']['statistics']['avg_views'],
            performance_gap=data.comparison.view_performance.performance_gap,
            top_recommendations=data.recommendations[:3],  # 상위 3개 제안만
            analysis_date=datetime.now().isoformat()
        )
        
        return {
            'success': True,
            'message': '채널 SEO 요약이 완료되었습니다.',
            'summary': summary
        }
        
    except Exception as e:
        logger.error(f"Failed to get SEO summary for channel {channel_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"채널 SEO 요약 조회 중 오류가 발생했습니다: {str(e)}"
        )

@router.post("/analyze", response_model=SEOAnalysisResponse)
async def analyze_channel_seo_alias(request: SEOAnalysisRequest):
    """
    채널의 SEO 분석을 수행합니다. (analyze-channel의 별칭)
    
    - **channel_id**: 분석할 YouTube 채널 ID
    - **percentile_threshold**: 상위/하위 그룹 분리 기준 (기본값: 0.2 = 상위/하위 20%)
    - **min_videos**: 분석에 필요한 최소 비디오 수 (기본값: 10개)
    """
    return await analyze_channel_seo(request)

@router.get("/health")
async def health_check():
    """SEO 분석 서비스 상태 확인"""
    return {
        'success': True,
        'message': 'SEO Analysis service is running',
        'timestamp': datetime.now().isoformat()
    }