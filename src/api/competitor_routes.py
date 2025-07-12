from fastapi import APIRouter, HTTPException, Depends
from src.services.competitor_analyzer import CompetitorAnalyzer
from src.models.competitor_models import (
    CompetitorAnalysisRequest,
    CompetitorAnalysisResponse
)
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/competitor", tags=["Competitor Analysis"])

# 서비스 인스턴스
competitor_analyzer = CompetitorAnalyzer()

@router.post("/analyze", response_model=CompetitorAnalysisResponse)
async def analyze_competitors(request: CompetitorAnalysisRequest):
    """
    경쟁사 분석을 수행합니다.
    
    - **target_channel_id**: 분석 대상 채널 ID (UCxxxxxx 형식)
    - **competitor_urls**: 경쟁사 채널 URL 목록
    - **analysis_period**: 분석 기간 (7d, 30d, 90d - 기본값: 30d)
    
    ## 분석 내용
    - 유사 채널 탐지 및 유사도 점수 계산
    - 성과 비교 (구독자, 조회수, 비디오 수)
    - 콘텐츠 전략 분석 (제목 패턴, 업로드 패턴)
    - 전략적 제안 생성
    - 시장 위치 및 성장 기회 분석
    """
    try:
        logger.info(f"Starting competitor analysis for channel: {request.target_channel_id} with {len(request.competitor_urls)} competitors")
        
        # 분석 기간 유효성 검사
        valid_periods = ['7d', '30d', '90d']
        if request.analysis_period not in valid_periods:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid analysis period. Must be one of: {', '.join(valid_periods)}"
            )
        
        # 경쟁사 URL 검증
        if not request.competitor_urls:
            raise HTTPException(
                status_code=400,
                detail="At least one competitor URL must be provided"
            )
        
        # 경쟁사 분석 수행
        result = await competitor_analyzer.analyze_competitors(
            target_channel_id=request.target_channel_id,
            competitor_urls=request.competitor_urls,
            analysis_period=request.analysis_period
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=404 if "찾을 수 없습니다" in result['message'] else 400,
                detail=result['message']
            )
        
        logger.info(f"Competitor analysis completed for channel {request.target_channel_id}")
        
        return CompetitorAnalysisResponse(
            success=result['success'],
            message=result['message'],
            data=result['data']
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Competitor analysis failed for channel {request.target_channel_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"경쟁사 분석 중 오류가 발생했습니다: {str(e)}"
        )

@router.get("/analyze/{channel_id}")
async def analyze_competitors_simple(
    channel_id: str,
    analysis_period: str = "30d",
    max_competitors: int = 10
):
    """
    간단한 경쟁사 분석 (GET 방식)
    
    - **channel_id**: 분석 대상 채널 ID
    - **analysis_period**: 분석 기간 (기본값: 30d)
    - **max_competitors**: 최대 경쟁사 수 (기본값: 10개)
    """
    try:
        # 요청 객체 생성
        request = CompetitorAnalysisRequest(
            target_channel_id=channel_id,
            analysis_period=analysis_period,
            max_competitors=max_competitors
        )
        
        # 분석 수행
        return await analyze_competitors(request)
        
    except Exception as e:
        logger.error(f"Simple competitor analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"분석 실패: {str(e)}")

@router.get("/health")
async def health_check():
    """경쟁사 분석 서비스 상태 확인"""
    return {
        'success': True,
        'message': 'Competitor Analysis service is running',
        'timestamp': datetime.now().isoformat(),
        'service': 'competitor_analyzer',
        'version': '1.0.0'
    }