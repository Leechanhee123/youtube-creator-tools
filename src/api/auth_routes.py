"""YouTube OAuth 2.0 인증 관련 API 라우터"""

from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import RedirectResponse
from typing import Optional

from ..models.auth_models import (
    AuthURL, TokenRequest, TokenResponse, UserInfo, 
    AuthenticatedUser, RefreshTokenRequest, ChannelAccessRequest,
    ChannelAccessResponse, AuthError
)
from ..services.oauth_service import YouTubeOAuthService
from ..services.youtube_analytics_service import YouTubeAnalyticsService
from ..services.youtube_reporting_service import YouTubeReportingService
from ..services.youtube_comment_service import YouTubeCommentService


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def get_oauth_service() -> YouTubeOAuthService:
    """OAuth 서비스 의존성 주입"""
    return YouTubeOAuthService()


def get_analytics_service() -> YouTubeAnalyticsService:
    """Analytics 서비스 의존성 주입"""
    return YouTubeAnalyticsService()


def get_reporting_service() -> YouTubeReportingService:
    """Reporting 서비스 의존성 주입"""
    return YouTubeReportingService()


def get_comment_service() -> YouTubeCommentService:
    """Comment 서비스 의존성 주입"""
    return YouTubeCommentService()


def get_access_token(authorization: Optional[str] = Header(None)) -> str:
    """Authorization 헤더에서 액세스 토큰 추출"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization 헤더가 필요합니다.")
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Bearer 토큰이 필요합니다.")
    
    return authorization[7:]  # "Bearer " 제거


@router.get("/login", response_model=AuthURL)
async def get_auth_url(oauth_service: YouTubeOAuthService = Depends(get_oauth_service)):
    """
    Google OAuth 인증 URL 생성
    
    사용자를 Google OAuth 인증 페이지로 리다이렉트하기 위한 URL을 생성합니다.
    """
    try:
        auth_url = oauth_service.generate_auth_url()
        return auth_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/callback", response_model=AuthenticatedUser)
async def oauth_callback(
    token_request: TokenRequest,
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    OAuth 콜백 처리
    
    Google OAuth 인증 후 받은 코드를 토큰으로 교환하고 사용자 정보를 조회합니다.
    """
    try:
        authenticated_user = await oauth_service.authenticate_user(
            code=token_request.code,
            state=token_request.state
        )
        return authenticated_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    액세스 토큰 갱신
    
    리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.
    """
    try:
        token_response = await oauth_service.refresh_access_token(
            refresh_token=refresh_request.refresh_token
        )
        return token_response
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/user", response_model=UserInfo)
async def get_user_info(
    access_token: str = Depends(get_access_token),
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    인증된 사용자 정보 조회
    
    액세스 토큰을 사용하여 사용자의 기본 정보를 조회합니다.
    """
    try:
        user_info = await oauth_service.get_user_info(access_token)
        return user_info
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/channels")
async def get_user_channels(
    refresh_token: str = None,
    access_token: str = Depends(get_access_token),
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    사용자의 YouTube 채널 목록 조회
    
    인증된 사용자가 소유한 YouTube 채널 목록을 조회합니다.
    """
    try:
        channels = await oauth_service.get_user_channels(access_token, refresh_token)
        return {
            "success": True,
            "message": f"{len(channels)}개의 채널을 찾았습니다.",
            "data": channels
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/verify-channel", response_model=ChannelAccessResponse)
async def verify_channel_access(
    request: ChannelAccessRequest,
    access_token: str = Depends(get_access_token),
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    채널 접근 권한 확인
    
    사용자가 특정 채널에 대한 소유권/관리 권한을 가지고 있는지 확인합니다.
    """
    try:
        access_response = await oauth_service.verify_channel_access(
            access_token=access_token,
            channel_id=request.channel_id
        )
        return access_response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_token(
    access_token: str = Depends(get_access_token),
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    토큰 유효성 검증
    
    제공된 액세스 토큰이 유효한지 확인합니다.
    """
    try:
        is_valid = oauth_service.validate_token(access_token)
        
        if is_valid:
            return {
                "success": True,
                "message": "토큰이 유효합니다.",
                "valid": True
            }
        else:
            return {
                "success": False,
                "message": "토큰이 유효하지 않습니다.",
                "valid": False
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/logout")
async def logout(
    access_token: str = Depends(get_access_token)
):
    """
    로그아웃
    
    사용자의 토큰을 무효화합니다.
    """
    try:
        # Google OAuth 토큰 무효화
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://oauth2.googleapis.com/revoke?token={access_token}"
            )
        
        return {
            "success": True,
            "message": "성공적으로 로그아웃되었습니다."
        }
    except Exception as e:
        # 토큰 무효화 실패해도 클라이언트에서는 로그아웃 처리
        return {
            "success": True,
            "message": "로그아웃되었습니다."
        }


@router.get("/analytics/revenue")
async def get_channel_revenue(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    analytics_service: YouTubeAnalyticsService = Depends(get_analytics_service)
):
    """
    채널 수익 정보 조회 (로그인 필요)
    
    로그인한 사용자의 채널 수익 데이터를 조회합니다.
    """
    try:
        result = await analytics_service.get_channel_revenue(
            access_token=access_token,
            channel_id=channel_id
        )
        
        if not result['success']:
            # Analytics API 접근 권한이 없는 경우 기본 메시지 반환
            return {
                'success': True,
                'message': '수익 데이터 접근 권한 없음',
                'data': {
                    'total_revenue': 0,
                    'ad_revenue': 0,
                    'partner_revenue': 0,
                    'gross_revenue': 0,
                    'period': f'{days}일',
                    'currency': 'USD',
                    'avg_daily_revenue': 0,
                    'note': '수익 데이터를 보려면 채널이 수익화되어 있어야 하며, YouTube Partner Program에 가입되어 있어야 합니다.'
                }
            }
            
        return result
        
    except Exception as e:
        # 에러 발생 시에도 기본 데이터 반환
        return {
            'success': True,
            'message': '수익 데이터 조회 제한',
            'data': {
                'total_revenue': 0,
                'ad_revenue': 0,
                'partner_revenue': 0,
                'gross_revenue': 0,
                'period': f'{days}일',
                'currency': 'USD',
                'avg_daily_revenue': 0,
                'note': f'수익 데이터 조회 중 오류: {str(e)}'
            }
        }


@router.get("/analytics/summary")
async def get_analytics_summary(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    analytics_service: YouTubeAnalyticsService = Depends(get_analytics_service)
):
    """
    채널 분석 요약 정보 조회 (로그인 필요)
    
    조회수, 시청시간, 구독자, 수익 등 종합 분석 데이터를 조회합니다.
    """
    try:
        # YouTube Analytics API 시도
        result = await analytics_service.get_channel_analytics_summary(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        # Analytics API 실패 시 기본 채널 정보로 대체
        if not result['success']:
            # YouTube Data API로 기본 통계 조회
            from ..services.youtube_data_api import YouTubeDataAPIService
            youtube_service = YouTubeDataAPIService()
            
            basic_stats = await youtube_service.get_channel_info(channel_id)
            if basic_stats['success']:
                channel_data = basic_stats['data']
                return {
                    'success': True,
                    'message': f'기본 채널 정보 조회 완료 (Analytics 데이터 제한)',
                    'data': {
                        'views': channel_data.get('statistics', {}).get('view_count', 0),
                        'watch_time_minutes': 0,  # Analytics API 필요
                        'watch_time_hours': 0,
                        'subscribers_gained': 0,  # Analytics API 필요
                        'subscribers_lost': 0,    # Analytics API 필요
                        'net_subscribers': 0,
                        'estimated_revenue': 0,   # Analytics API 필요
                        'ad_revenue': 0,          # Analytics API 필요
                        'period_days': days,
                        'avg_daily_views': 0,
                        'avg_daily_revenue': 0,
                        'note': 'YouTube Analytics API 권한이 제한되어 기본 정보만 표시됩니다.'
                    }
                }
            else:
                raise HTTPException(status_code=400, detail="채널 정보 조회 실패")
            
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"분석 데이터 조회 실패: {str(e)}")


@router.get("/analytics/comprehensive")
async def get_comprehensive_analytics(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    reporting_service: YouTubeReportingService = Depends(get_reporting_service)
):
    """
    종합 채널 분석 리포트 조회 (로그인 필요)
    
    YouTube Reporting API를 사용한 상세 분석:
    - 기본 사용자 활동 (조회수, 시청시간, 참여도)
    - 트래픽 소스 분석 (유입 경로)
    - 기기/OS 분석
    - 시청자 인구통계
    - 재생 위치 분석
    - 참여 기능 (카드, 최종화면)
    - 수익 분석 (권한 있는 경우)
    - 재생목록 분석
    """
    try:
        result = await reporting_service.get_comprehensive_analytics(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"종합 분석 실패: {str(e)}")


@router.get("/analytics/traffic-sources")
async def get_traffic_sources_report(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    analytics_service: YouTubeAnalyticsService = Depends(get_analytics_service)
):
    """트래픽 소스 상세 분석"""
    try:
        result = await analytics_service.get_traffic_source_data(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"트래픽 소스 분석 실패: {str(e)}")


@router.get("/analytics/demographics")
async def get_demographics_report(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    analytics_service: YouTubeAnalyticsService = Depends(get_analytics_service)
):
    """시청자 인구통계 분석"""
    try:
        result = await analytics_service.get_demographics_data(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"인구통계 분석 실패: {str(e)}")


@router.get("/analytics/devices")
async def get_device_analysis_report(
    channel_id: str,
    days: int = 30,
    access_token: str = Depends(get_access_token),
    reporting_service: YouTubeReportingService = Depends(get_reporting_service)
):
    """기기/OS 분석"""
    try:
        result = await reporting_service.get_comprehensive_analytics(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        if result['success']:
            return {
                'success': True,
                'message': '기기 분석 완료',
                'data': result['data'].get('device_analysis'),
                'period': result.get('period')
            }
        else:
            return result
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"기기 분석 실패: {str(e)}")


@router.get("/comments/video/{video_id}")
async def get_video_comments(
    video_id: str,
    max_results: int = 100,
    order: str = "time",
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    비디오 댓글 목록 조회
    
    Args:
        video_id: 비디오 ID
        max_results: 최대 결과 수 (기본값: 100)
        order: 정렬 순서 (time, relevance)
    """
    try:
        result = await comment_service.get_video_comments(
            access_token=access_token,
            video_id=video_id,
            max_results=max_results,
            order=order
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 조회 실패: {str(e)}")


@router.get("/comments/channel/{channel_id}")
async def get_channel_comments(
    channel_id: str,
    max_results: int = 100,
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    채널의 모든 댓글 조회 (채널 소유자만 가능)
    
    Args:
        channel_id: 채널 ID
        max_results: 최대 결과 수
    """
    try:
        result = await comment_service.get_channel_comments(
            access_token=access_token,
            channel_id=channel_id,
            max_results=max_results
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"채널 댓글 조회 실패: {str(e)}")


@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    댓글 삭제
    
    Args:
        comment_id: 삭제할 댓글 ID
    """
    try:
        result = await comment_service.delete_comment(
            access_token=access_token,
            comment_id=comment_id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"댓글 삭제 실패: {str(e)}")


@router.post("/comments/delete-multiple")
async def delete_multiple_comments(
    request: dict,
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    여러 댓글 일괄 삭제
    
    Args:
        request: {"comment_ids": ["id1", "id2", ...]}
    """
    try:
        comment_ids = request.get("comment_ids", [])
        
        if not comment_ids:
            raise HTTPException(status_code=400, detail="댓글 ID가 필요합니다.")
        
        result = await comment_service.delete_multiple_comments(
            access_token=access_token,
            comment_ids=comment_ids
        )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일괄 댓글 삭제 실패: {str(e)}")


@router.get("/comments/spam-detection/{video_id}")
async def detect_spam_comments(
    video_id: str,
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    스팸 댓글 탐지
    
    Args:
        video_id: 비디오 ID
    """
    try:
        result = await comment_service.detect_spam_comments(
            access_token=access_token,
            video_id=video_id
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스팸 댓글 탐지 실패: {str(e)}")


@router.post("/comments/spam-cleanup/{video_id}")
async def cleanup_spam_comments(
    video_id: str,
    access_token: str = Depends(get_access_token),
    comment_service: YouTubeCommentService = Depends(get_comment_service)
):
    """
    스팸 댓글 자동 삭제
    
    Args:
        video_id: 비디오 ID
    """
    try:
        # 스팸 댓글 탐지
        spam_result = await comment_service.detect_spam_comments(
            access_token=access_token,
            video_id=video_id
        )
        
        if not spam_result['success']:
            return spam_result
        
        spam_comments = spam_result['data']['spam_comments']
        
        if not spam_comments:
            return {
                'success': True,
                'message': '삭제할 스팸 댓글이 없습니다.',
                'data': {
                    'deleted_count': 0,
                    'total_spam_count': 0
                }
            }
        
        # 스팸 댓글 일괄 삭제
        comment_ids = [comment['comment_id'] for comment in spam_comments]
        delete_result = await comment_service.delete_multiple_comments(
            access_token=access_token,
            comment_ids=comment_ids
        )
        
        return {
            'success': True,
            'message': f'스팸 댓글 정리 완료: {delete_result["success_count"]}개 삭제, {delete_result["fail_count"]}개 실패',
            'data': {
                'deleted_count': delete_result['success_count'],
                'failed_count': delete_result['fail_count'],
                'total_spam_count': len(spam_comments),
                'spam_percentage': spam_result['data']['spam_percentage']
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스팸 댓글 정리 실패: {str(e)}")