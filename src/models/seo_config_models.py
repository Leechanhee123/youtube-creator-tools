from typing import Dict, List, Optional, Union
from pydantic import BaseModel, Field
from enum import Enum


class ChannelType(str, Enum):
    """채널 타입 열거형"""
    GAMING = "gaming"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    LIFESTYLE = "lifestyle"
    DEFAULT = "default"


class VideoType(str, Enum):
    """비디오 타입 열거형"""
    SHORTS = "shorts"
    REGULAR = "regular"
    LIVE = "live"


class KeywordCategory(str, Enum):
    """키워드 카테고리 열거형"""
    ATTENTION_GRABBING = "attention_grabbing"
    QUESTION_WORDS = "question_words"
    TRENDING_WORDS = "trending_words"
    EMOTIONAL_WORDS = "emotional_words"
    SHORTS_SPECIFIC = "shorts_specific"


class LanguageKeywords(BaseModel):
    """언어별 키워드 설정"""
    attention_grabbing: List[str] = Field(default_factory=list, description="관심 유발 키워드")
    question_words: List[str] = Field(default_factory=list, description="질문형 키워드")
    trending_words: List[str] = Field(default_factory=list, description="트렌드 키워드")
    emotional_words: List[str] = Field(default_factory=list, description="감정 키워드")
    shorts_specific: List[str] = Field(default_factory=list, description="Shorts 특화 키워드")


class KeywordPatterns(BaseModel):
    """키워드 패턴 설정"""
    korean: LanguageKeywords = Field(default_factory=LanguageKeywords, description="한국어 키워드")
    english: LanguageKeywords = Field(default_factory=LanguageKeywords, description="영어 키워드")


class ChannelTypeWeights(BaseModel):
    """채널 타입별 키워드 가중치"""
    attention_grabbing: float = Field(default=1.0, ge=0.0, le=3.0, description="관심 유발 키워드 가중치")
    question_words: float = Field(default=1.0, ge=0.0, le=3.0, description="질문형 키워드 가중치")
    trending_words: float = Field(default=1.0, ge=0.0, le=3.0, description="트렌드 키워드 가중치")
    emotional_words: float = Field(default=1.0, ge=0.0, le=3.0, description="감정 키워드 가중치")
    shorts_specific: float = Field(default=1.0, ge=0.0, le=3.0, description="Shorts 특화 키워드 가중치")


class EngagementScoreWeights(BaseModel):
    """참여도 점수 계산 가중치"""
    view_count: float = Field(default=0.7, ge=0.0, le=1.0, description="조회수 가중치")
    like_rate: float = Field(default=0.2, ge=0.0, le=1.0, description="좋아요 비율 가중치")
    comment_rate: float = Field(default=0.1, ge=0.0, le=1.0, description="댓글 비율 가중치")
    
    def validate_sum(self):
        """가중치 합이 1.0인지 검증"""
        total = self.view_count + self.like_rate + self.comment_rate
        if abs(total - 1.0) > 0.001:
            raise ValueError(f"가중치 합이 1.0이 아닙니다: {total}")


class AnalysisThresholds(BaseModel):
    """분석 임계값 설정"""
    percentile_threshold: float = Field(default=0.2, ge=0.05, le=0.5, description="상위/하위 그룹 분리 기준")
    min_videos_required: int = Field(default=10, ge=5, le=100, description="분석 최소 필요 비디오 수")
    shorts_duration_threshold: int = Field(default=60, ge=30, le=180, description="Shorts 판단 기준 (초)")
    significant_keyword_diff: float = Field(default=0.3, ge=0.1, le=1.0, description="유의미한 키워드 차이 기준")
    significant_length_diff: int = Field(default=5, ge=1, le=20, description="유의미한 제목 길이 차이 기준")
    significant_desc_length_diff: int = Field(default=100, ge=50, le=500, description="유의미한 설명 길이 차이 기준")


class TitleLengthStandards(BaseModel):
    """비디오 타입별 제목 길이 기준"""
    min_length: int = Field(default=10, ge=5, le=50, description="최소 길이")
    max_length: int = Field(default=70, ge=30, le=150, description="최대 길이")
    optimal_length: int = Field(default=50, ge=20, le=100, description="최적 길이")


class VideoTypeLengthStandards(BaseModel):
    """비디오 타입별 제목 길이 기준"""
    shorts: TitleLengthStandards = Field(default_factory=lambda: TitleLengthStandards(min_length=10, max_length=40, optimal_length=25))
    regular: TitleLengthStandards = Field(default_factory=lambda: TitleLengthStandards(min_length=30, max_length=70, optimal_length=50))
    live: TitleLengthStandards = Field(default_factory=lambda: TitleLengthStandards(min_length=20, max_length=60, optimal_length=40))


class SEOAnalysisConfig(BaseModel):
    """SEO 분석 설정 전체"""
    # 기본 설정
    enabled: bool = Field(default=True, description="SEO 분석 활성화 여부")
    
    # 키워드 패턴
    keyword_patterns: KeywordPatterns = Field(default_factory=KeywordPatterns, description="키워드 패턴")
    
    # 채널 타입별 가중치
    channel_type_weights: Dict[ChannelType, ChannelTypeWeights] = Field(
        default_factory=dict, description="채널 타입별 키워드 가중치"
    )
    
    # 참여도 점수 가중치
    engagement_weights: EngagementScoreWeights = Field(
        default_factory=EngagementScoreWeights, description="참여도 점수 계산 가중치"
    )
    
    # 분석 임계값
    thresholds: AnalysisThresholds = Field(
        default_factory=AnalysisThresholds, description="분석 임계값"
    )
    
    # 제목 길이 기준
    title_length_standards: VideoTypeLengthStandards = Field(
        default_factory=VideoTypeLengthStandards, description="비디오 타입별 제목 길이 기준"
    )
    
    # 자동 채널 타입 감지 키워드
    channel_detection_keywords: Dict[ChannelType, List[str]] = Field(
        default_factory=dict, description="채널 타입 자동 감지용 키워드"
    )


class SEOAnalysisRequest(BaseModel):
    """SEO 분석 요청"""
    channel_id: str = Field(..., description="분석할 채널 ID")
    config: Optional[SEOAnalysisConfig] = Field(None, description="커스텀 분석 설정 (없으면 기본값 사용)")
    force_channel_type: Optional[ChannelType] = Field(None, description="강제 채널 타입 설정")
    use_cached_videos: bool = Field(default=True, description="캐시된 비디오 데이터 사용 여부")


class SEOConfigPreset(BaseModel):
    """SEO 설정 프리셋"""
    name: str = Field(..., description="프리셋 이름")
    description: str = Field(..., description="프리셋 설명")
    config: SEOAnalysisConfig = Field(..., description="SEO 분석 설정")
    is_default: bool = Field(default=False, description="기본 프리셋 여부")
    created_at: Optional[str] = Field(None, description="생성 시간")
    updated_at: Optional[str] = Field(None, description="수정 시간")


def get_default_seo_config() -> SEOAnalysisConfig:
    """기본 SEO 분석 설정 반환"""
    return SEOAnalysisConfig(
        keyword_patterns=KeywordPatterns(
            korean=LanguageKeywords(
                attention_grabbing=['꿀팁', '대박', '충격', '실화', '레전드', '최고', '완전', '진짜', '놀라운', '역대급', '갓', '쩔어'],
                question_words=['어떻게', '왜', '무엇', '언제', '어디서', '누가', '방법', '비법', '노하우', '팁', '가이드'],
                trending_words=['핫', '트렌드', '인기', '유행', '신상', '최신', '요즘', '급상승', '화제', '바이럴'],
                emotional_words=['감동', '눈물', '웃음', '재미', '신기', '놀라운', '감사', '힐링', '따뜻한', '소름'],
                shorts_specific=['짧은', '빠른', '1분', '30초', '간단', '요약', '핵심', 'vs', '비교', '랭킹']
            ),
            english=LanguageKeywords(
                attention_grabbing=['amazing', 'incredible', 'shocking', 'unbelievable', 'best', 'ultimate', 'perfect', 'epic', 'insane', 'mind-blowing'],
                question_words=['how', 'why', 'what', 'when', 'where', 'who', 'tutorial', 'guide', 'tips'],
                trending_words=['trending', 'viral', 'popular', 'hot', 'new', 'latest', 'breaking', 'trending now'],
                emotional_words=['funny', 'sad', 'exciting', 'amazing', 'wonderful', 'heartwarming', 'satisfying', 'relaxing'],
                shorts_specific=['short', 'quick', '1min', '30sec', 'fast', 'summary', 'vs', 'comparison', 'ranking']
            )
        ),
        channel_type_weights={
            ChannelType.GAMING: ChannelTypeWeights(
                attention_grabbing=1.5, trending_words=1.3, emotional_words=1.2, 
                question_words=1.0, shorts_specific=1.4
            ),
            ChannelType.EDUCATION: ChannelTypeWeights(
                attention_grabbing=1.0, trending_words=0.8, emotional_words=0.9, 
                question_words=1.5, shorts_specific=1.1
            ),
            ChannelType.ENTERTAINMENT: ChannelTypeWeights(
                attention_grabbing=1.4, trending_words=1.5, emotional_words=1.3, 
                question_words=1.1, shorts_specific=1.3
            ),
            ChannelType.LIFESTYLE: ChannelTypeWeights(
                attention_grabbing=1.2, trending_words=1.4, emotional_words=1.3, 
                question_words=1.2, shorts_specific=1.2
            ),
            ChannelType.DEFAULT: ChannelTypeWeights()
        },
        channel_detection_keywords={
            ChannelType.GAMING: ['게임', '플레이', '게임플레이', 'gameplay', 'gaming', '공략', '리뷰', '스킬', '레벨', '아이템'],
            ChannelType.EDUCATION: ['강의', '강좌', '교육', '학습', '공부', '수업', '튜토리얼', 'tutorial', '가이드', '배우기'],
            ChannelType.ENTERTAINMENT: ['예능', '웃긴', '재미', '코미디', '엔터', '방송', '쇼', '개그', '유머', '리액션'],
            ChannelType.LIFESTYLE: ['일상', '브이로그', 'vlog', '먹방', '쿠킹', '뷰티', '패션', '여행', '라이프', '힐링']
        }
    )


def get_preset_configs() -> List[SEOConfigPreset]:
    """사전 정의된 프리셋 설정들 반환"""
    presets = []
    
    # 기본 프리셋
    default_config = get_default_seo_config()
    presets.append(SEOConfigPreset(
        name="기본 설정",
        description="모든 채널 타입에 적합한 균형잡힌 설정",
        config=default_config,
        is_default=True
    ))
    
    # 게이밍 특화 프리셋
    gaming_config = get_default_seo_config()
    gaming_config.engagement_weights.view_count = 0.6
    gaming_config.engagement_weights.like_rate = 0.3
    gaming_config.engagement_weights.comment_rate = 0.1
    gaming_config.thresholds.percentile_threshold = 0.15
    
    presets.append(SEOConfigPreset(
        name="게이밍 특화",
        description="게이밍 채널에 최적화된 설정 (참여도 중시)",
        config=gaming_config
    ))
    
    # 교육 특화 프리셋
    education_config = get_default_seo_config()
    education_config.engagement_weights.view_count = 0.8
    education_config.engagement_weights.like_rate = 0.1
    education_config.engagement_weights.comment_rate = 0.1
    education_config.thresholds.min_videos_required = 15
    
    presets.append(SEOConfigPreset(
        name="교육 특화",
        description="교육 채널에 최적화된 설정 (조회수 중시)",
        config=education_config
    ))
    
    # Shorts 특화 프리셋
    shorts_config = get_default_seo_config()
    shorts_config.thresholds.shorts_duration_threshold = 90
    shorts_config.title_length_standards.shorts.optimal_length = 20
    shorts_config.title_length_standards.shorts.max_length = 35
    
    presets.append(SEOConfigPreset(
        name="Shorts 특화",
        description="YouTube Shorts에 최적화된 설정",
        config=shorts_config
    ))
    
    return presets