from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class SEOAnalysisRequest(BaseModel):
    """SEO 분석 요청 모델"""
    channel_id: str = Field(..., description="분석할 채널 ID")
    percentile_threshold: float = Field(default=0.2, description="상위/하위 그룹 분리 기준 (0.2 = 20%)")
    min_videos: int = Field(default=10, description="분석에 필요한 최소 비디오 수")

class VideoStatistics(BaseModel):
    """비디오 통계 모델"""
    avg_views: float
    median_views: float
    avg_likes: float
    avg_comments: float
    total_views: int

class KeywordUsage(BaseModel):
    """키워드 사용 분석 모델"""
    attention_grabbing: int
    question_words: int
    trending_words: int
    emotional_words: int

class SpecialChars(BaseModel):
    """특수 문자 사용 분석 모델"""
    exclamation: int
    question: int
    brackets: int
    quotes: int
    numbers: int

class TitleAnalysis(BaseModel):
    """제목 분석 모델"""
    avg_length: float
    avg_word_count: float
    max_length: int
    min_length: int
    keyword_usage: KeywordUsage
    special_chars: SpecialChars
    total_titles: int

class DescriptionAnalysis(BaseModel):
    """설명 분석 모델"""
    avg_length: float
    avg_lines: float
    avg_links: float
    avg_hashtags: float
    max_length: int
    has_description_ratio: float

class UploadTimeAnalysis(BaseModel):
    """업로드 시간 분석 모델"""
    most_common_hour: Dict[str, int]
    most_common_day: Dict[str, Any]
    hour_distribution: Dict[str, int]
    day_distribution: Dict[str, int]
    month_distribution: Dict[str, int]

class VideoGroupAnalysis(BaseModel):
    """비디오 그룹 분석 모델"""
    group_name: str
    video_count: int
    statistics: VideoStatistics
    title_analysis: TitleAnalysis
    description_analysis: DescriptionAnalysis
    upload_time_analysis: UploadTimeAnalysis

class ViewPerformance(BaseModel):
    """조회수 성능 비교 모델"""
    top_avg_views: float
    bottom_avg_views: float
    performance_gap: float

class TitleDifferences(BaseModel):
    """제목 차이점 모델"""
    length_diff: float
    word_count_diff: float
    keyword_usage_diff: Dict[str, float]

class DescriptionDifferences(BaseModel):
    """설명 차이점 모델"""
    length_diff: float
    link_usage_diff: float
    hashtag_usage_diff: float

class GroupComparison(BaseModel):
    """그룹 비교 분석 모델"""
    view_performance: ViewPerformance
    title_differences: TitleDifferences
    description_differences: DescriptionDifferences
    timing_differences: Dict[str, Any]

class SEORecommendation(BaseModel):
    """SEO 개선 제안 모델"""
    category: str = Field(..., description="제안 카테고리")
    type: str = Field(..., description="제안 타입")
    priority: str = Field(..., description="우선순위: high, medium, low")
    suggestion: str = Field(..., description="구체적인 제안 내용")
    impact: str = Field(..., description="예상 효과: high, medium, low")

class SEOAnalysisData(BaseModel):
    """SEO 분석 데이터 모델"""
    total_videos: int
    analysis_groups: Dict[str, Dict[str, Any]]
    comparison: GroupComparison
    recommendations: List[SEORecommendation]
    percentile_threshold: float

class SEOAnalysisResponse(BaseModel):
    """SEO 분석 응답 모델"""
    success: bool
    message: str
    data: Optional[SEOAnalysisData] = None

class ChannelSEOSummary(BaseModel):
    """채널 SEO 요약 모델"""
    channel_id: str
    total_videos: int
    avg_views_top_group: float
    avg_views_bottom_group: float
    performance_gap: float
    top_recommendations: List[SEORecommendation]
    analysis_date: str