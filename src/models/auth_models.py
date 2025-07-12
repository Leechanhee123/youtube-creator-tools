"""OAuth 2.0 인증 관련 Pydantic 모델"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class OAuthConfig(BaseModel):
    """OAuth 2.0 설정"""
    client_id: str
    client_secret: str
    redirect_uri: str
    scope: List[str]
    

class AuthURL(BaseModel):
    """인증 URL 응답"""
    auth_url: str = Field(..., description="Google OAuth 인증 URL")
    state: str = Field(..., description="CSRF 방지를 위한 state 파라미터")


class TokenRequest(BaseModel):
    """토큰 요청"""
    code: str = Field(..., description="OAuth 인증 코드")
    state: str = Field(..., description="state 파라미터")


class TokenResponse(BaseModel):
    """토큰 응답"""
    access_token: str
    refresh_token: Optional[str] = None
    expires_in: int
    token_type: str = "Bearer"
    scope: str


class UserInfo(BaseModel):
    """사용자 정보"""
    google_id: str = Field(..., description="Google 사용자 ID")
    email: str = Field(..., description="사용자 이메일")
    name: str = Field(..., description="사용자 이름")
    picture: Optional[str] = Field(None, description="프로필 이미지 URL")


class UserChannel(BaseModel):
    """사용자 채널 정보"""
    channel_id: str = Field(..., description="YouTube 채널 ID")
    title: str = Field(..., description="채널 제목")
    description: Optional[str] = Field(None, description="채널 설명")
    thumbnail_url: Optional[str] = Field(None, description="채널 썸네일 URL")
    subscriber_count: Optional[int] = Field(None, description="구독자 수")
    video_count: Optional[int] = Field(None, description="비디오 수")
    view_count: Optional[int] = Field(None, description="총 조회수")


class AuthenticatedUser(BaseModel):
    """인증된 사용자 정보"""
    user_info: UserInfo
    channels: List[UserChannel]
    access_token: str
    refresh_token: Optional[str] = None
    expires_at: datetime


class RefreshTokenRequest(BaseModel):
    """토큰 갱신 요청"""
    refresh_token: str = Field(..., description="리프레시 토큰")


class AuthError(BaseModel):
    """인증 에러"""
    error: str = Field(..., description="에러 코드")
    error_description: str = Field(..., description="에러 설명")


class ChannelAccessRequest(BaseModel):
    """채널 접근 요청"""
    channel_id: str = Field(..., description="접근하려는 채널 ID")


class ChannelAccessResponse(BaseModel):
    """채널 접근 응답"""
    has_access: bool = Field(..., description="접근 권한 여부")
    channel_info: Optional[UserChannel] = Field(None, description="채널 정보")
    message: str = Field(..., description="응답 메시지")