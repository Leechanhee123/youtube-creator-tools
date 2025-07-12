/**
 * OAuth 2.0 인증 관련 타입 정의
 */

export interface AuthURL {
  auth_url: string;
  state: string;
}

export interface TokenRequest {
  code: string;
  state: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface UserInfo {
  google_id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface UserChannel {
  channel_id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  subscriber_count?: number;
  video_count?: number;
  view_count?: number;
}

export interface AuthenticatedUser {
  user_info: UserInfo;
  channels: UserChannel[];
  access_token: string;
  refresh_token?: string;
  expires_at: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface ChannelAccessRequest {
  channel_id: string;
}

export interface ChannelAccessResponse {
  has_access: boolean;
  channel_info?: UserChannel;
  message: string;
}

export interface AuthError {
  error: string;
  error_description: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  channels: UserChannel[] | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: Date | null;
  loading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<boolean>;
  verifyChannelAccess: (channelId: string) => Promise<ChannelAccessResponse>;
  handleAuthCallback: (code: string, state: string) => Promise<void>;
  isTokenExpired: () => boolean;
}

export interface StoredAuthData {
  user: UserInfo;
  channels: UserChannel[];
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}