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


router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


def get_oauth_service() -> YouTubeOAuthService:
    """OAuth 서비스 의존성 주입"""
    return YouTubeOAuthService()


def get_analytics_service() -> YouTubeAnalyticsService:
    """Analytics 서비스 의존성 주입"""
    return YouTubeAnalyticsService()


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
    access_token: str = Depends(get_access_token),
    oauth_service: YouTubeOAuthService = Depends(get_oauth_service)
):
    """
    사용자의 YouTube 채널 목록 조회
    
    인증된 사용자가 소유한 YouTube 채널 목록을 조회합니다.
    """
    try:
        channels = await oauth_service.get_user_channels(access_token)
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
            raise HTTPException(status_code=400, detail=result['message'])
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        result = await analytics_service.get_channel_analytics_summary(
            access_token=access_token,
            channel_id=channel_id,
            days=days
        )
        
        if not result['success']:
            raise HTTPException(status_code=400, detail=result['message'])
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))