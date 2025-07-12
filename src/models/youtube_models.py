from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime

class CommentDownloadRequest(BaseModel):
    video_url: str = Field(..., description="YouTube 비디오 URL 또는 ID")
    limit: Optional[int] = Field(None, description="다운로드할 댓글 수 제한")
    language: str = Field("ko", description="댓글 언어 필터")
    sort_by: str = Field("top", description="정렬 방식 (top, new)")
    
    @field_validator('video_url')
    @classmethod
    def validate_video_url(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Video URL cannot be empty')
        return v.strip()
    
    @field_validator('sort_by')
    @classmethod
    def validate_sort_by(cls, v):
        if v not in ['top', 'new']:
            raise ValueError('sort_by must be either "top" or "new"')
        return v

class CommentSearchRequest(BaseModel):
    video_url: str = Field(..., description="YouTube 비디오 URL 또는 ID")
    search_term: str = Field(..., description="검색할 키워드")
    case_sensitive: bool = Field(False, description="대소문자 구분 여부")
    
    @field_validator('search_term')
    @classmethod
    def validate_search_term(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Search term cannot be empty')
        return v.strip()

class CommentData(BaseModel):
    comment_id: str = Field(..., description="댓글 고유 ID")
    text: str = Field(..., description="댓글 내용")
    author: str = Field(..., description="작성자 이름")
    author_id: Optional[str] = Field(None, description="작성자 채널 ID")
    timestamp: Optional[str] = Field(None, description="작성 시간")
    like_count: int = Field(0, description="좋아요 수")
    reply_count: int = Field(0, description="답글 수")
    is_favorited: bool = Field(False, description="하트 표시 여부")
    is_reply: bool = Field(False, description="답글 여부")
    parent_id: Optional[str] = Field(None, description="부모 댓글 ID")
    raw_data: Optional[Dict[str, Any]] = Field(None, description="원본 데이터")

class VideoInfo(BaseModel):
    video_id: str = Field(..., description="비디오 ID")
    video_url: str = Field(..., description="비디오 URL")
    has_comments: bool = Field(..., description="댓글 존재 여부")

class CommentDownloadResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    video_info: VideoInfo = Field(..., description="비디오 정보")
    comments: List[CommentData] = Field(..., description="댓글 리스트")
    total_count: int = Field(..., description="총 댓글 수")

class CommentSearchResponse(BaseModel):
    success: bool = Field(..., description="성공 여부")
    message: str = Field(..., description="응답 메시지")
    video_info: VideoInfo = Field(..., description="비디오 정보")
    search_term: str = Field(..., description="검색 키워드")
    comments: List[CommentData] = Field(..., description="검색된 댓글 리스트")
    total_count: int = Field(..., description="검색된 댓글 수")

class ErrorResponse(BaseModel):
    success: bool = Field(False, description="성공 여부")
    error: str = Field(..., description="에러 메시지")
    details: Optional[str] = Field(None, description="상세 에러 정보")