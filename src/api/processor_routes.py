from fastapi import APIRouter, HTTPException
from src.services.youtube_downloader import YouTubeCommentDownloaderService
from src.services.comment_processor import CommentProcessor
from src.models.processor_models import (
    CommentProcessRequest,
    CommentProcessResponse,
    AnalyzeCommentsRequest,
    AnalyzeCommentsResponse,
    DuplicateGroups,
    SpamPatterns,
    ProcessingSummary
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/processor", tags=["Comment Processor"])

# 서비스 인스턴스
downloader_service = YouTubeCommentDownloaderService()
processor = CommentProcessor()

@router.post("/analyze-video", response_model=CommentProcessResponse)
async def analyze_video_comments(request: CommentProcessRequest):
    """
    YouTube 영상의 댓글을 다운로드하고 매크로/스팸 댓글을 분석합니다.
    
    - **video_url**: YouTube 영상 URL 또는 비디오 ID
    - **download_limit**: 다운로드할 댓글 수 (선택사항)
    - **similarity_threshold**: 유사도 임계값 (0.0~1.0)
    - **min_duplicate_count**: 중복으로 간주할 최소 개수
    """
    try:
        # 비디오 ID 추출
        video_id = downloader_service._extract_video_id(request.video_url)
        if not video_id:
            raise ValueError("Invalid YouTube URL or video ID")
        
        # 임계값 설정
        if request.similarity_threshold is not None:
            processor.similarity_threshold = request.similarity_threshold
        if request.min_duplicate_count is not None:
            processor.min_duplicate_count = request.min_duplicate_count
        
        # 댓글 다운로드
        logger.info(f"Downloading comments for video: {video_id}")
        comments = await downloader_service.download_comments(
            video_url=request.video_url,
            limit=request.download_limit
        )
        
        if not comments:
            return CommentProcessResponse(
                success=True,
                message="No comments found for analysis",
                video_id=video_id,
                total_comments=0,
                suspicious_count=0,
                duplicate_groups=DuplicateGroups(
                    exact_duplicates={'count': 0, 'groups': []},
                    similar_groups={'count': 0, 'groups': []}
                ),
                spam_patterns=SpamPatterns(
                    exact_duplicates=0,
                    similar_groups=0,
                    suspicious_authors=[],
                    common_phrases=[],
                    short_repetitive=0,
                    emoji_spam=0,
                    link_spam=0
                ),
                suspicious_comment_ids=[],
                processing_summary=ProcessingSummary(
                    exact_duplicate_groups=0,
                    similar_groups=0,
                    suspicious_authors=0,
                    spam_indicators={'short_repetitive': 0, 'emoji_only': 0, 'contains_links': 0}
                )
            )
        
        # 댓글 분석 및 처리
        logger.info(f"Processing {len(comments)} comments")
        analysis_result = processor.process_comments(comments)
        
        # 응답 구성
        return CommentProcessResponse(
            success=True,
            message=f"Successfully analyzed {len(comments)} comments. Found {analysis_result['suspicious_count']} suspicious comments.",
            video_id=video_id,
            total_comments=analysis_result['total_comments'],
            suspicious_count=analysis_result['suspicious_count'],
            duplicate_groups=DuplicateGroups(**analysis_result['duplicate_groups']),
            spam_patterns=SpamPatterns(**analysis_result['spam_patterns']),
            suspicious_comment_ids=analysis_result['suspicious_comment_ids'],
            processing_summary=ProcessingSummary(**analysis_result['processing_summary'])
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing video comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/analyze-comments", response_model=AnalyzeCommentsResponse)
async def analyze_comment_data(request: AnalyzeCommentsRequest):
    """
    제공된 댓글 데이터를 분석하여 매크로/스팸 댓글을 탐지합니다.
    
    - **comments**: 분석할 댓글 데이터 목록
    - **similarity_threshold**: 유사도 임계값 (0.0~1.0)
    - **min_duplicate_count**: 중복으로 간주할 최소 개수
    """
    try:
        if not request.comments:
            raise ValueError("No comments provided for analysis")
        
        # 임계값 설정
        if request.similarity_threshold is not None:
            processor.similarity_threshold = request.similarity_threshold
        if request.min_duplicate_count is not None:
            processor.min_duplicate_count = request.min_duplicate_count
        
        # 댓글 분석
        logger.info(f"Analyzing {len(request.comments)} provided comments")
        analysis_result = processor.process_comments(request.comments)
        
        # 응답 구성
        return AnalyzeCommentsResponse(
            success=True,
            message=f"Successfully analyzed {len(request.comments)} comments. Found {analysis_result['suspicious_count']} suspicious comments.",
            total_comments=analysis_result['total_comments'],
            suspicious_count=analysis_result['suspicious_count'],
            duplicate_groups=DuplicateGroups(**analysis_result['duplicate_groups']),
            spam_patterns=SpamPatterns(**analysis_result['spam_patterns']),
            suspicious_comment_ids=analysis_result['suspicious_comment_ids'],
            processing_summary=ProcessingSummary(**analysis_result['processing_summary'])
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error analyzing comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/similarity/{text1}/{text2}")
async def calculate_text_similarity(text1: str, text2: str):
    """
    두 텍스트 간의 유사도를 계산합니다.
    
    - **text1**: 비교할 첫 번째 텍스트
    - **text2**: 비교할 두 번째 텍스트
    """
    try:
        similarity = processor.calculate_similarity(text1, text2)
        
        return {
            "success": True,
            "text1": text1,
            "text2": text2,
            "similarity": round(similarity, 4),
            "is_similar": similarity >= processor.similarity_threshold,
            "threshold": processor.similarity_threshold
        }
        
    except Exception as e:
        logger.error(f"Error calculating similarity: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/settings")
async def get_processor_settings():
    """현재 프로세서 설정을 반환합니다."""
    return {
        "similarity_threshold": processor.similarity_threshold,
        "min_duplicate_count": processor.min_duplicate_count
    }

@router.put("/settings")
async def update_processor_settings(
    similarity_threshold: float = None,
    min_duplicate_count: int = None
):
    """
    프로세서 설정을 업데이트합니다.
    
    - **similarity_threshold**: 유사도 임계값 (0.0~1.0)
    - **min_duplicate_count**: 중복으로 간주할 최소 개수
    """
    try:
        if similarity_threshold is not None:
            if not 0.0 <= similarity_threshold <= 1.0:
                raise ValueError("similarity_threshold must be between 0.0 and 1.0")
            processor.similarity_threshold = similarity_threshold
        
        if min_duplicate_count is not None:
            if min_duplicate_count < 2:
                raise ValueError("min_duplicate_count must be at least 2")
            processor.min_duplicate_count = min_duplicate_count
        
        return {
            "success": True,
            "message": "Settings updated successfully",
            "current_settings": {
                "similarity_threshold": processor.similarity_threshold,
                "min_duplicate_count": processor.min_duplicate_count
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating settings: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def processor_health_check():
    """Comment Processor 서비스 상태 확인"""
    return {
        "status": "healthy",
        "service": "Comment Processor",
        "message": "Processor service is running properly",
        "settings": {
            "similarity_threshold": processor.similarity_threshold,
            "min_duplicate_count": processor.min_duplicate_count
        }
    }