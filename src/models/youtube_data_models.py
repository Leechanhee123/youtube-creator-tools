from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class ChannelInfoRequest(BaseModel):
    channel_id: Optional[str] = Field(None, description="채널 ID (UCxxxxxx 형식)")
    username: Optional[str] = Field(None, description="사용자명 (@username 형식)")
    handle: Optional[str] = Field(None, description="핸들 (@handle 형식)")
    url: Optional[str] = Field(None, description="YouTube 채널 URL (자동 파싱)")
    
    @model_validator(mode='after')
    def check_at_least_one_field(self):
        if not any([self.channel_id, self.username, self.handle, self.url]):
            raise ValueError('At least one of channel_id, username, handle, or url must be provided')
        return self

class ChannelVideosRequest(BaseModel):
    channel_id: str = Field(..., description="채널 ID")
    max_results: int = Field(50, ge=1, le=50, description="최대 결과 수 (1-50)")
    order: str = Field("date", description="정렬 순서")
    
    @field_validator('order')
    @classmethod
    def validate_order(cls, v):
        valid_orders = ['date', 'rating', 'relevance', 'title', 'videoCount', 'viewCount']
        if v not in valid_orders:
            raise ValueError(f'order must be one of: {", ".join(valid_orders)}')
        return v

class VideoStatisticsRequest(BaseModel):
    video_id: str = Field(..., description="비디오 ID")

class ChannelSearchRequest(BaseModel):
    query: str = Field(..., description="검색어")
    max_results: int = Field(25, ge=1, le=50, description="최대 결과 수 (1-50)")

# Response Models
class ChannelStatistics(BaseModel):
    view_count: int = Field(..., description="총 조회수")
    subscriber_count: int = Field(..., description="구독자 수")
    hidden_subscriber_count: bool = Field(..., description="구독자 수 숨김 여부")
    video_count: int = Field(..., description="업로드된 비디오 수")

class ChannelBranding(BaseModel):
    channel_title: Optional[str] = Field(None, description="채널 제목")
    channel_description: Optional[str] = Field(None, description="채널 설명")
    keywords: Optional[str] = Field(None, description="키워드")
    banner_image_url: Optional[str] = Field(None, description="배너 이미지 URL")

class ChannelStatus(BaseModel):
    privacy_status: Optional[str] = Field(None, description="공개 상태")
    is_linked: Optional[bool] = Field(None, description="연결 여부")
    long_uploads_status: Optional[str] = Field(None, description="긴 업로드 상태")
    made_for_kids: Optional[bool] = Field(None, description="어린이용 컨텐츠 여부")

class ChannelInfo(BaseModel):
    channel_id: str = Field(..., description="채널 ID")
    title: str = Field(..., description="채널 제목")
    description: Optional[str] = Field(None, description="채널 설명")
    custom_url: Optional[str] = Field(None, description="커스텀 URL")
    published_at: Optional[str] = Field(None, description="채널 생성일")
    thumbnails: Dict[str, Any] = Field(default_factory=dict, description="썸네일 이미지들")
    default_language: Optional[str] = Field(None, description="기본 언어")
    country: Optional[str] = Field(None, description="국가")
    statistics: ChannelStatistics = Field(..., description="채널 통계")
    branding: ChannelBranding = Field(..., description="브랜딩 정보")
    status: ChannelStatus = Field(..., description="채널 상태")

class VideoStatistics(BaseModel):
    view_count: int = Field(..., description="조회수")
    like_count: int = Field(..., description="좋아요 수")
    favorite_count: int = Field(..., description="즐겨찾기 수")
    comment_count: int = Field(..., description="댓글 수")

class VideoStatus(BaseModel):
    upload_status: Optional[str] = Field(None, description="업로드 상태")
    privacy_status: Optional[str] = Field(None, description="공개 상태")
    license: Optional[str] = Field(None, description="라이선스")
    embeddable: Optional[bool] = Field(None, description="임베드 가능 여부")
    public_stats_viewable: Optional[bool] = Field(None, description="공개 통계 조회 가능 여부")
    made_for_kids: Optional[bool] = Field(None, description="어린이용 컨텐츠 여부")

class VideoContentDetails(BaseModel):
    duration: Optional[str] = Field(None, description="비디오 길이")
    dimension: Optional[str] = Field(None, description="비디오 차원")
    definition: Optional[str] = Field(None, description="비디오 해상도")
    caption: Optional[str] = Field(None, description="자막 여부")
    licensed_content: Optional[bool] = Field(None, description="라이선스 컨텐츠 여부")
    projection: Optional[str] = Field(None, description="프로젝션 타입")

class VideoInfo(BaseModel):
    video_id: str = Field(..., description="비디오 ID")
    title: str = Field(..., description="비디오 제목")
    description: Optional[str] = Field(None, description="비디오 설명")
    channel_id: str = Field(..., description="채널 ID")
    channel_title: str = Field(..., description="채널 제목")
    published_at: Optional[str] = Field(None, description="업로드 날짜")
    thumbnails: Dict[str, Any] = Field(default_factory=dict, description="썸네일 이미지들")
    tags: List[str] = Field(default_factory=list, description="태그 목록")
    category_id: Optional[str] = Field(None, description="카테고리 ID")
    default_language: Optional[str] = Field(None, description="기본 언어")
    default_audio_language: Optional[str] = Field(None, description="기본 오디오 언어")
    statistics: VideoStatistics = Field(..., description="비디오 통계")
    status: VideoStatus = Field(..., description="비디오 상태")
    content_details: VideoContentDetails = Field(..., description="컨텐츠 세부 정보")

class SimpleVideoInfo(BaseModel):
    video_id: str = Field(..., description="비디오 ID")
    title: str = Field(..., description="비디오 제목")
    description: Optional[str] = Field(None, description="비디오 설명")
    published_at: Optional[str] = Field(None, description="업로드 날짜")
    thumbnails: Dict[str, Any] = Field(default_factory=dict, description="썸네일 이미지들")
    channel_id: str = Field(..., description="채널 ID")
    channel_title: str = Field(..., description="채널 제목")
    video_url: str = Field(..., description="비디오 URL")

class SimpleChannelInfo(BaseModel):
    channel_id: str = Field(..., description="채널 ID")
    title: str = Field(..., description="채널 제목")
    description: Optional[str] = Field(None, description="채널 설명")
    published_at: Optional[str] = Field(None, description="채널 생성일")
    thumbnails: Dict[str, Any] = Field(default_factory=dict, description="썸네일 이미지들")
    channel_url: str = Field(..., description="채널 URL")

# API Response Models
class ChannelInfoResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    data: Optional[ChannelInfo] = Field(None, description="채널 정보")

class ChannelVideosResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    data: Optional[Dict[str, Any]] = Field(None, description="비디오 목록 데이터")

class VideoStatisticsResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    data: Optional[VideoInfo] = Field(None, description="비디오 정보")

class ChannelSearchResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    data: Optional[Dict[str, Any]] = Field(None, description="검색 결과 데이터")

class APITestResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    api_key_status: str = Field(..., description="API 키 상태")