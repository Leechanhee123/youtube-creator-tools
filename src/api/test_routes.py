from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import logging
from src.services.youtube_data_api import YouTubeDataAPIService

logger = logging.getLogger(__name__)

router = APIRouter()

class VideoCommentsTestRequest(BaseModel):
    video_url: str
    max_results: Optional[int] = 50
    order: str = "time"

@router.post("/test/comments")
async def test_video_comments(request: VideoCommentsTestRequest):
    """
    YouTube Data API v3를 사용해서 댓글 수집을 테스트합니다.
    """
    try:
        # YouTube Data API 서비스 초기화
        youtube_service = YouTubeDataAPIService()
        
        # URL에서 비디오 ID 추출
        video_id = youtube_service._extract_video_id_from_url(request.video_url)
        if not video_id:
            raise HTTPException(
                status_code=400,
                detail=f"유효하지 않은 YouTube URL입니다: {request.video_url}"
            )
        
        logger.info(f"비디오 ID 추출됨: {video_id}")
        logger.info(f"요청 파라미터: max_results={request.max_results}, order={request.order}")
        
        # 댓글 수집
        result = await youtube_service.get_video_comments(
            video_id=video_id,
            max_results=request.max_results,
            order=request.order
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=400,
                detail=result['message']
            )
        
        # 테스트용으로 댓글 텍스트만 간단히 정리
        comments_preview = []
        for comment in result['comments'][:10]:  # 처음 10개만 미리보기
            comments_preview.append({
                'author': comment['author'],
                'text': comment['text'][:100] + '...' if len(comment['text']) > 100 else comment['text'],
                'like_count': comment['like_count'],
                'is_reply': comment['is_reply']
            })
        
        return {
            'success': True,
            'message': result['message'],
            'video_id': video_id,
            'video_url': request.video_url,
            'total_comments': result['total_comments'],
            'quota_used': result['metadata']['quota_used'],
            'pages_fetched': result['metadata']['pages_fetched'],
            'comments_preview': comments_preview,
            'full_comments': result['comments']  # 전체 댓글 데이터
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"댓글 테스트 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )

@router.get("/test/api-status")
async def test_api_status():
    """
    YouTube Data API 연결 상태를 테스트합니다.
    """
    try:
        youtube_service = YouTubeDataAPIService()
        result = await youtube_service.test_api_connection()
        
        return {
            'success': result['success'],
            'message': result['message'],
            'api_key_status': result['api_key_status']
        }
        
    except Exception as e:
        logger.error(f"API 상태 테스트 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"서버 오류: {str(e)}"
        )