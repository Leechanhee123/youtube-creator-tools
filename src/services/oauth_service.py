"""YouTube OAuth 2.0 인증 서비스"""

import os
import secrets
import json
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from ..models.auth_models import (
    AuthURL, TokenResponse, UserInfo, UserChannel, 
    AuthenticatedUser, ChannelAccessResponse
)
from ..core.config import settings


class YouTubeOAuthService:
    """YouTube OAuth 2.0 인증 서비스"""
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.OAUTH_REDIRECT_URI
        self.scopes = [
            'https://www.googleapis.com/auth/youtube.readonly',
            'https://www.googleapis.com/auth/youtube.force-ssl',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
        
        # OAuth 플로우 설정
        self.client_config = {
            "web": {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [self.redirect_uri]
            }
        }

    def generate_auth_url(self) -> AuthURL:
        """OAuth 인증 URL 생성"""
        try:
            # CSRF 방지를 위한 state 생성
            state = secrets.token_urlsafe(32)
            
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                state=state
            )
            flow.redirect_uri = self.redirect_uri
            
            auth_url, _ = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'  # 리프레시 토큰을 위해 consent 화면 강제 표시
            )
            
            return AuthURL(auth_url=auth_url, state=state)
            
        except Exception as e:
            raise Exception(f"인증 URL 생성 실패: {str(e)}")

    async def exchange_code_for_tokens(self, code: str, state: str) -> TokenResponse:
        """인증 코드를 토큰으로 교환"""
        try:
            flow = Flow.from_client_config(
                self.client_config,
                scopes=self.scopes,
                state=state
            )
            flow.redirect_uri = self.redirect_uri
            
            # 토큰 요청
            flow.fetch_token(code=code)
            
            credentials = flow.credentials
            
            return TokenResponse(
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                expires_in=3600,  # 기본 1시간
                token_type="Bearer",
                scope=" ".join(self.scopes)
            )
            
        except Exception as e:
            raise Exception(f"토큰 교환 실패: {str(e)}")

    async def get_user_info(self, access_token: str) -> UserInfo:
        """액세스 토큰으로 사용자 정보 조회"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {access_token}"}
                )
                response.raise_for_status()
                
                user_data = response.json()
                
                return UserInfo(
                    google_id=user_data["id"],
                    email=user_data["email"],
                    name=user_data["name"],
                    picture=user_data.get("picture")
                )
                
        except Exception as e:
            raise Exception(f"사용자 정보 조회 실패: {str(e)}")

    async def get_user_channels(self, access_token: str) -> List[UserChannel]:
        """사용자의 YouTube 채널 목록 조회"""
        try:
            credentials = Credentials(token=access_token)
            youtube = build('youtube', 'v3', credentials=credentials)
            
            # 사용자의 채널 목록 조회
            request = youtube.channels().list(
                part='snippet,statistics,contentDetails',
                mine=True
            )
            response = request.execute()
            
            channels = []
            for item in response.get('items', []):
                snippet = item.get('snippet', {})
                statistics = item.get('statistics', {})
                
                channel = UserChannel(
                    channel_id=item['id'],
                    title=snippet.get('title', ''),
                    description=snippet.get('description', ''),
                    thumbnail_url=snippet.get('thumbnails', {}).get('default', {}).get('url'),
                    subscriber_count=int(statistics.get('subscriberCount', 0)),
                    video_count=int(statistics.get('videoCount', 0)),
                    view_count=int(statistics.get('viewCount', 0))
                )
                channels.append(channel)
            
            return channels
            
        except HttpError as e:
            raise Exception(f"채널 목록 조회 실패: {str(e)}")
        except Exception as e:
            raise Exception(f"채널 목록 조회 중 오류: {str(e)}")

    async def refresh_access_token(self, refresh_token: str) -> TokenResponse:
        """리프레시 토큰으로 액세스 토큰 갱신"""
        try:
            async with httpx.AsyncClient() as client:
                data = {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'refresh_token': refresh_token,
                    'grant_type': 'refresh_token'
                }
                
                response = await client.post(
                    "https://oauth2.googleapis.com/token",
                    data=data
                )
                response.raise_for_status()
                
                token_data = response.json()
                
                return TokenResponse(
                    access_token=token_data['access_token'],
                    refresh_token=refresh_token,  # 리프레시 토큰은 보통 변경되지 않음
                    expires_in=token_data['expires_in'],
                    token_type=token_data['token_type'],
                    scope=token_data.get('scope', '')
                )
                
        except Exception as e:
            raise Exception(f"토큰 갱신 실패: {str(e)}")

    async def verify_channel_access(self, access_token: str, channel_id: str) -> ChannelAccessResponse:
        """사용자가 특정 채널에 접근 권한이 있는지 확인"""
        try:
            user_channels = await self.get_user_channels(access_token)
            
            for channel in user_channels:
                if channel.channel_id == channel_id:
                    return ChannelAccessResponse(
                        has_access=True,
                        channel_info=channel,
                        message="채널 접근 권한이 확인되었습니다."
                    )
            
            return ChannelAccessResponse(
                has_access=False,
                channel_info=None,
                message="해당 채널에 대한 접근 권한이 없습니다."
            )
            
        except Exception as e:
            return ChannelAccessResponse(
                has_access=False,
                channel_info=None,
                message=f"채널 접근 권한 확인 실패: {str(e)}"
            )

    async def authenticate_user(self, code: str, state: str) -> AuthenticatedUser:
        """전체 인증 플로우 처리"""
        try:
            # 1. 코드로 토큰 교환
            token_response = await self.exchange_code_for_tokens(code, state)
            
            # 2. 사용자 정보 조회
            user_info = await self.get_user_info(token_response.access_token)
            
            # 3. 사용자 채널 목록 조회
            channels = await self.get_user_channels(token_response.access_token)
            
            # 4. 만료 시간 계산
            expires_at = datetime.utcnow() + timedelta(seconds=token_response.expires_in)
            
            return AuthenticatedUser(
                user_info=user_info,
                channels=channels,
                access_token=token_response.access_token,
                refresh_token=token_response.refresh_token,
                expires_at=expires_at
            )
            
        except Exception as e:
            raise Exception(f"사용자 인증 실패: {str(e)}")

    def validate_token(self, access_token: str) -> bool:
        """액세스 토큰 유효성 검증"""
        try:
            credentials = Credentials(token=access_token)
            youtube = build('youtube', 'v3', credentials=credentials)
            
            # 간단한 API 호출로 토큰 유효성 검증
            request = youtube.channels().list(part='id', mine=True)
            request.execute()
            
            return True
            
        except Exception:
            return False