/**
 * OAuth 2.0 인증 서비스
 */

import axios from 'axios';
import type {
  AuthURL,
  TokenRequest,
  TokenResponse,
  UserInfo,
  UserChannel,
  AuthenticatedUser,
  RefreshTokenRequest,
  ChannelAccessRequest,
  ChannelAccessResponse
} from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AuthService {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: `${API_BASE_URL}/api/v1/auth`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터: 액세스 토큰 자동 추가
    this.axiosInstance.interceptors.request.use((config) => {
      const token = this.getStoredAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 응답 인터셉터: 401 에러 시 토큰 갱신 시도
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            // 토큰 갱신 성공 시 원래 요청 재시도
            return this.axiosInstance.request(error.config);
          } else {
            // 토큰 갱신 실패 시 로그아웃
            this.clearStoredAuth();
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Google OAuth 인증 URL 가져오기
   */
  async getAuthURL(): Promise<AuthURL> {
    try {
      const response = await this.axiosInstance.get<AuthURL>('/login');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '인증 URL 생성 실패');
    }
  }

  /**
   * OAuth 콜백 처리 (인증 코드를 토큰으로 교환)
   */
  async handleCallback(code: string, state: string): Promise<AuthenticatedUser> {
    try {
      const response = await this.axiosInstance.post<AuthenticatedUser>('/callback', {
        code,
        state
      });
      
      // 인증 정보 로컬 스토리지에 저장
      this.storeAuthData(response.data);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'OAuth 콜백 처리 실패');
    }
  }

  /**
   * 액세스 토큰 갱신
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const response = await this.axiosInstance.post<TokenResponse>('/refresh', {
        refresh_token: refreshToken
      });
      
      // 새 토큰 정보 업데이트
      this.updateStoredTokens(response.data);
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '토큰 갱신 실패');
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await this.axiosInstance.get<UserInfo>('/user');
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '사용자 정보 조회 실패');
    }
  }

  /**
   * 사용자 채널 목록 조회
   */
  async getUserChannels(): Promise<UserChannel[]> {
    try {
      const response = await this.axiosInstance.get('/channels');
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '채널 목록 조회 실패');
    }
  }

  /**
   * 채널 접근 권한 확인
   */
  async verifyChannelAccess(channelId: string): Promise<ChannelAccessResponse> {
    try {
      const response = await this.axiosInstance.post<ChannelAccessResponse>('/verify-channel', {
        channel_id: channelId
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || '채널 접근 권한 확인 실패');
    }
  }

  /**
   * 토큰 유효성 검증
   */
  async validateToken(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post('/validate');
      return response.data.valid;
    } catch (error) {
      return false;
    }
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    try {
      await this.axiosInstance.post('/logout');
    } catch (error) {
      console.warn('서버 로그아웃 실패, 로컬 데이터만 삭제');
    } finally {
      this.clearStoredAuth();
    }
  }

  /**
   * 인증 데이터를 로컬 스토리지에 저장
   */
  private storeAuthData(authData: AuthenticatedUser): void {
    const storageData = {
      user: authData.user_info,
      channels: authData.channels,
      accessToken: authData.access_token,
      refreshToken: authData.refresh_token,
      expiresAt: authData.expires_at
    };
    
    localStorage.setItem('youtube_auth', JSON.stringify(storageData));
  }

  /**
   * 토큰 정보만 업데이트
   */
  private updateStoredTokens(tokenData: TokenResponse): void {
    const stored = this.getStoredAuthData();
    if (stored) {
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();
      const updatedData = {
        ...stored,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || stored.refreshToken,
        expiresAt
      };
      localStorage.setItem('youtube_auth', JSON.stringify(updatedData));
    }
  }

  /**
   * 저장된 인증 데이터 조회
   */
  getStoredAuthData(): any {
    const stored = localStorage.getItem('youtube_auth');
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * 저장된 액세스 토큰 조회
   */
  private getStoredAccessToken(): string | null {
    const authData = this.getStoredAuthData();
    return authData?.accessToken || null;
  }

  /**
   * 토큰 만료 확인
   */
  isTokenExpired(): boolean {
    const authData = this.getStoredAuthData();
    if (!authData?.expiresAt) return true;
    
    const expiresAt = new Date(authData.expiresAt);
    const now = new Date();
    
    // 5분 여유를 두고 만료 확인
    return now.getTime() + 5 * 60 * 1000 >= expiresAt.getTime();
  }

  /**
   * 자동 토큰 갱신 시도
   */
  private async tryRefreshToken(): Promise<boolean> {
    const authData = this.getStoredAuthData();
    if (!authData?.refreshToken) return false;

    try {
      await this.refreshToken(authData.refreshToken);
      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }

  /**
   * 저장된 인증 정보 삭제
   */
  private clearStoredAuth(): void {
    localStorage.removeItem('youtube_auth');
  }
}

export const authService = new AuthService();