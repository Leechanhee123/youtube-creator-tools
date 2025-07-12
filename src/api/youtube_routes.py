from fastapi import APIRouter, HTTPException, BackgroundTasks
from src.services.youtube_downloader import YouTubeCommentDownloaderService
from src.models.youtube_models import (
    CommentDownloadRequest,
    CommentSearchRequest,
    CommentDownloadResponse,
    CommentSearchResponse,
    VideoInfo,
    CommentData,
    ErrorResponse
)
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/youtube", tags=["YouTube Comment Downloader"])

# 서비스 인스턴스
downloader_service = YouTubeCommentDownloaderService()

@router.post("/comments/download", response_model=CommentDownloadResponse)
async def download_comments(request: CommentDownloadRequest):
    """
    YouTube 영상의 댓글을 다운로드합니다.
    
    - **video_url**: YouTube 영상 URL 또는 비디오 ID
    - **limit**: 다운로드할 댓글 수 (선택사항)
    - **language**: 댓글 언어 필터 (기본값: ko)
    - **sort_by**: 정렬 방식 (top 또는 new)
    """
    try:
        # 비디오 정보 가져오기
        video_info = await downloader_service.get_video_info(request.video_url)
        
        # 댓글 다운로드
        comments_raw = await downloader_service.download_comments(
            video_url=request.video_url,
            limit=request.limit,
            language=request.language,
            sort_by=request.sort_by
        )
        
        # 응답 데이터 구성
        comments = [CommentData(**comment) for comment in comments_raw]
        
        return CommentDownloadResponse(
            success=True,
            message=f"Successfully downloaded {len(comments)} comments",
            video_info=VideoInfo(**video_info),
            comments=comments,
            total_count=len(comments)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error downloading comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/comments/search", response_model=CommentSearchResponse)
async def search_comments(request: CommentSearchRequest):
    """
    YouTube 영상에서 특정 키워드를 포함한 댓글을 검색합니다.
    
    - **video_url**: YouTube 영상 URL 또는 비디오 ID
    - **search_term**: 검색할 키워드
    - **case_sensitive**: 대소문자 구분 여부 (기본값: False)
    """
    try:
        # 비디오 정보 가져오기
        video_info = await downloader_service.get_video_info(request.video_url)
        
        # 댓글 검색
        comments_raw = await downloader_service.search_comments(
            video_url=request.video_url,
            search_term=request.search_term,
            case_sensitive=request.case_sensitive
        )
        
        # 응답 데이터 구성
        comments = [CommentData(**comment) for comment in comments_raw]
        
        return CommentSearchResponse(
            success=True,
            message=f"Found {len(comments)} comments containing '{request.search_term}'",
            video_info=VideoInfo(**video_info),
            search_term=request.search_term,
            comments=comments,
            total_count=len(comments)
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/video/info")
async def get_video_info(video_url: str):
    """
    YouTube 영상의 기본 정보를 가져옵니다.
    
    - **video_url**: YouTube 영상 URL 또는 비디오 ID
    """
    try:
        video_info = await downloader_service.get_video_info(video_url)
        
        return {
            "success": True,
            "message": "Video info retrieved successfully",
            "video_info": video_info
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting video info: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/health")
async def health_check():
    """YouTube Comment Downloader 서비스 상태 확인"""
    return {
        "status": "healthy",
        "service": "YouTube Comment Downloader",
        "message": "Service is running properly"
    }