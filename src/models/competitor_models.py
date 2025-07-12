from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class CompetitorAnalysisRequest(BaseModel):
    """경쟁사 분석 요청 모델"""
    target_channel_id: str = Field(..., description="분석 대상 채널 ID")
    competitor_urls: List[str] = Field(..., description="경쟁사 채널 URL 목록")
    analysis_period: str = Field(default="30d", description="분석 기간 (7d, 30d, 90d)")

class PerformanceComparison(BaseModel):
    """성과 비교 모델"""
    subscriber_ratio: float = Field(description="구독자 수 비율 (경쟁사/대상채널)")
    view_ratio: float = Field(description="총 조회수 비율")
    video_ratio: float = Field(description="비디오 수 비율")
    avg_views_per_video_ratio: float = Field(description="평균 조회수 비율")

class ContentInsights(BaseModel):
    """콘텐츠 인사이트 모델"""
    avg_title_length: float = Field(description="평균 제목 길이")
    common_title_patterns: List[str] = Field(description="공통 제목 패턴")
    upload_pattern: Dict[str, Any] = Field(description="업로드 패턴")
    recent_video_count: int = Field(description="최근 비디오 수")

class ChannelStats(BaseModel):
    """채널 통계 모델"""
    subscriber_count: int = Field(description="구독자 수")
    view_count: int = Field(description="총 조회수")
    video_count: int = Field(description="비디오 수")

class CompetitorInfo(BaseModel):
    """경쟁사 정보 모델"""
    channel_id: str = Field(description="채널 ID")
    title: str = Field(description="채널 제목")
    similarity_score: float = Field(description="유사도 점수 (0-1)")
    performance_comparison: PerformanceComparison = Field(description="성과 비교")
    content_insights: ContentInsights = Field(description="콘텐츠 인사이트")
    channel_stats: ChannelStats = Field(description="채널 통계")

class StrategicRecommendation(BaseModel):
    """전략적 제안 모델"""
    priority: str = Field(description="우선순위 (high, medium, low)")
    type: str = Field(description="제안 타입")
    suggestion: str = Field(description="제안 내용")
    impact: str = Field(description="예상 효과")

class MarketInsights(BaseModel):
    """시장 인사이트 모델"""
    market_position: str = Field(description="시장 위치 (top, middle, bottom)")
    total_competitors_analyzed: int = Field(description="분석된 경쟁사 수")
    growth_opportunities: List[str] = Field(description="성장 기회")
    market_avg_subscribers: int = Field(description="시장 평균 구독자 수")
    competitive_advantage: str = Field(description="경쟁 우위")

class TargetChannelInfo(BaseModel):
    """대상 채널 정보 모델"""
    channel_id: str = Field(description="채널 ID")
    title: str = Field(description="채널 제목")
    subscriber_count: int = Field(description="구독자 수")
    video_count: int = Field(description="비디오 수")
    view_count: int = Field(description="총 조회수")
    topic_categories: List[str] = Field(description="주제 카테고리")

class AnalysisMetadata(BaseModel):
    """분석 메타데이터 모델"""
    analysis_period: str = Field(description="분석 기간")
    analyzed_at: str = Field(description="분석 수행 시간")
    total_competitors_found: int = Field(description="발견된 총 경쟁사 수")

class CompetitorAnalysisData(BaseModel):
    """경쟁사 분석 데이터 모델"""
    target_channel: TargetChannelInfo = Field(description="대상 채널 정보")
    competitors: List[CompetitorInfo] = Field(description="경쟁사 목록")
    strategic_recommendations: List[StrategicRecommendation] = Field(description="전략적 제안")
    market_insights: MarketInsights = Field(description="시장 인사이트")
    analysis_metadata: AnalysisMetadata = Field(description="분석 메타데이터")

class CompetitorAnalysisResponse(BaseModel):
    """경쟁사 분석 응답 모델"""
    success: bool = Field(description="성공 여부")
    message: str = Field(description="응답 메시지")
    data: Optional[CompetitorAnalysisData] = Field(description="분석 결과 데이터")