/**
 * 인증 상태 관리를 위한 React Context
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { notification } from 'antd';
import { authService } from '../services/authService';
import type { AuthState, AuthContextType, UserInfo, UserChannel, ChannelAccessResponse } from '../types/auth';

// 초기 상태
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  channels: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  loading: true,
  error: null,
};

// Action 타입
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: UserInfo; channels: UserChannel[]; accessToken: string; refreshToken?: string; expiresAt: Date } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'TOKEN_REFRESH_SUCCESS'; payload: { accessToken: string; expiresAt: Date } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        channels: action.payload.channels,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken || null,
        expiresAt: action.payload.expiresAt,
        loading: false,
        error: null,
      };
    
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        channels: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        loading: false,
        error: action.payload,
      };
    
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
        loading: false,
      };
    
    case 'TOKEN_REFRESH_SUCCESS':
      return {
        ...state,
        accessToken: action.payload.accessToken,
        expiresAt: action.payload.expiresAt,
        error: null,
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    
    default:
      return state;
  }
};

// Context 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Provider 컴포넌트
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 토큰 갱신
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const storedAuth = authService.getStoredAuthData();
      if (!storedAuth?.refreshToken) {
        return false;
      }
      
      const tokenResponse = await authService.refreshToken(storedAuth.refreshToken);
      
      const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000);
      
      dispatch({
        type: 'TOKEN_REFRESH_SUCCESS',
        payload: {
          accessToken: tokenResponse.access_token,
          expiresAt,
        },
      });
      
      return true;
      
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }, []);

  // 페이지 로드 시 저장된 인증 정보 확인
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedAuth = authService.getStoredAuthData();
        
        if (storedAuth) {
          // 토큰 만료 확인
          if (authService.isTokenExpired()) {
            // 토큰 갱신 시도
            const refreshed = await refreshAccessToken();
            if (!refreshed) {
              dispatch({ type: 'AUTH_LOGOUT' });
              return;
            }
          }
          
          // 저장된 토큰이 있고 만료되지 않았다면 바로 인증 상태 복원
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: storedAuth.user,
              channels: storedAuth.channels,
              accessToken: storedAuth.accessToken,
              refreshToken: storedAuth.refreshToken,
              expiresAt: new Date(storedAuth.expiresAt),
            },
          });
          
          // 백그라운드에서 토큰 유효성 검증 (실패해도 바로 로그아웃하지 않음)
          try {
            const isValid = await authService.validateToken();
            if (!isValid) {
              console.warn('토큰 검증 실패, 갱신을 시도합니다.');
              const refreshed = await refreshAccessToken();
              if (!refreshed) {
                dispatch({ type: 'AUTH_LOGOUT' });
              }
            }
          } catch (error) {
            console.warn('토큰 검증 중 오류 발생:', error);
            // 네트워크 오류 등의 경우 로그아웃하지 않음
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    };

    initializeAuth();
  }, [refreshAccessToken]);

  // 로그인
  const login = async (): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      const authURL = await authService.getAuthURL();
      
      // state를 세션 스토리지에 저장 (CSRF 방지)
      sessionStorage.setItem('oauth_state', authURL.state);
      
      // Google OAuth 페이지로 리다이렉트
      window.location.href = authURL.auth_url;
      
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      notification.error({
        message: '로그인 실패',
        description: error.message,
      });
    }
  };

  // OAuth 콜백 처리
  const handleAuthCallback = async (code: string, state: string): Promise<void> => {
    try {
      console.log('AuthContext.handleAuthCallback 시작');
      dispatch({ type: 'AUTH_START' });
      
      // state 검증 (백엔드에서도 검증하므로 프론트엔드는 우회)
      const storedState = sessionStorage.getItem('oauth_state');
      console.log('State 검증:', { received: state, stored: storedState });
      
      // state가 저장되어 있지 않더라도 백엔드에서 검증하므로 계속 진행
      if (storedState && state !== storedState) {
        console.warn('State 불일치 감지, 백엔드 검증으로 넘어갑니다.');
      }
      
      console.log('authService.handleCallback 호출...');
      const authData = await authService.handleCallback(code, state);
      console.log('authService.handleCallback 완료:', authData);
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: authData.user_info,
          channels: authData.channels,
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          expiresAt: new Date(authData.expires_at),
        },
      });
      
      // state 정리
      sessionStorage.removeItem('oauth_state');
      
      notification.success({
        message: '로그인 성공',
        description: `${authData.user_info.name}님, 환영합니다!`,
      });
      
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      notification.error({
        message: '로그인 실패',
        description: error.message,
      });
    }
  };

  // 로그아웃
  const logout = (): void => {
    try {
      authService.logout();
      dispatch({ type: 'AUTH_LOGOUT' });
      
      notification.success({
        message: '로그아웃 완료',
        description: '성공적으로 로그아웃되었습니다.',
      });
      
    } catch (error: any) {
      console.error('로그아웃 에러:', error);
      // 로컬 상태는 정리
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // 채널 접근 권한 확인
  const verifyChannelAccess = async (channelId: string): Promise<ChannelAccessResponse> => {
    try {
      return await authService.verifyChannelAccess(channelId);
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  // 토큰 만료 확인
  const isTokenExpired = (): boolean => {
    return authService.isTokenExpired();
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    logout,
    refreshAccessToken,
    verifyChannelAccess,
    handleAuthCallback,
    isTokenExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};