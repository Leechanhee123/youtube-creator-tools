from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class CommentProcessRequest(BaseModel):
    video_url: str = Field(..., description="YouTube 비디오 URL 또는 ID")
    download_limit: Optional[int] = Field(None, description="다운로드할 댓글 수 제한")
    similarity_threshold: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="유사도 임계값 (0.0~1.0)")
    min_duplicate_count: Optional[int] = Field(3, ge=2, description="중복으로 간주할 최소 개수")

class DuplicateGroup(BaseModel):
    text_sample: str = Field(..., description="대표 텍스트")
    duplicate_count: int = Field(..., description="중복 개수")
    comment_ids: List[str] = Field(..., description="중복 댓글 ID 목록")
    authors: List[str] = Field(..., description="작성자 목록")

class SimilarityGroup(BaseModel):
    representative_text: str = Field(..., description="대표 텍스트")
    similar_count: int = Field(..., description="유사 댓글 개수")
    comment_ids: List[str] = Field(..., description="유사 댓글 ID 목록")
    authors: List[str] = Field(..., description="작성자 목록")
    similarity_samples: List[Dict[str, Any]] = Field(..., description="유사도 샘플")

class DuplicateGroups(BaseModel):
    exact_duplicates: Dict[str, Any] = Field(..., description="완전 중복 그룹")
    similar_groups: Dict[str, Any] = Field(..., description="유사 댓글 그룹")

class SuspiciousAuthor(BaseModel):
    author: str = Field(..., description="작성자명")
    count: int = Field(..., description="댓글 개수")

class CommonPhrase(BaseModel):
    phrase: str = Field(..., description="자주 등장하는 구문")
    count: int = Field(..., description="등장 횟수")

class SpamPatterns(BaseModel):
    exact_duplicates: int = Field(..., description="완전 중복 그룹 수")
    similar_groups: int = Field(..., description="유사 그룹 수")
    suspicious_authors: List[SuspiciousAuthor] = Field(..., description="의심스러운 작성자들")
    common_phrases: List[CommonPhrase] = Field(..., description="자주 등장하는 구문들")
    short_repetitive: int = Field(..., description="짧고 반복적인 댓글 수")
    emoji_spam: int = Field(..., description="이모지만 있는 댓글 수")
    link_spam: int = Field(..., description="링크 포함 댓글 수")

class ProcessingSummary(BaseModel):
    exact_duplicate_groups: int = Field(..., description="완전 중복 그룹 수")
    similar_groups: int = Field(..., description="유사 그룹 수")
    suspicious_authors: int = Field(..., description="의심스러운 작성자 수")
    spam_indicators: Dict[str, int] = Field(..., description="스팸 지표들")

class CommentProcessResponse(BaseModel):
    success: bool = Field(..., description="처리 성공 여부")
    message: str = Field(..., description="처리 결과 메시지")
    video_id: str = Field(..., description="비디오 ID")
    total_comments: int = Field(..., description="전체 댓글 수")
    suspicious_count: int = Field(..., description="의심스러운 댓글 수")
    duplicate_groups: DuplicateGroups = Field(..., description="중복 댓글 그룹 정보")
    spam_patterns: SpamPatterns = Field(..., description="스팸 패턴 분석 결과")
    suspicious_comment_ids: List[str] = Field(..., description="의심스러운 댓글 ID 목록")
    processing_summary: ProcessingSummary = Field(..., description="처리 요약")

class AnalyzeCommentsRequest(BaseModel):
    comments: List[Dict[str, Any]] = Field(..., description="분석할 댓글 데이터 목록")
    similarity_threshold: Optional[float] = Field(0.8, ge=0.0, le=1.0, description="유사도 임계값")
    min_duplicate_count: Optional[int] = Field(3, ge=2, description="중복으로 간주할 최소 개수")

class AnalyzeCommentsResponse(BaseModel):
    success: bool = Field(..., description="분석 성공 여부")
    message: str = Field(..., description="분석 결과 메시지")
    total_comments: int = Field(..., description="전체 댓글 수")
    suspicious_count: int = Field(..., description="의심스러운 댓글 수")
    duplicate_groups: DuplicateGroups = Field(..., description="중복 댓글 그룹 정보")
    spam_patterns: SpamPatterns = Field(..., description="스팸 패턴 분석 결과")
    suspicious_comment_ids: List[str] = Field(..., description="의심스러운 댓글 ID 목록")
    processing_summary: ProcessingSummary = Field(..., description="처리 요약")