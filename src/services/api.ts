import axios from 'axios';
import type {
  APIResponse,
  ChannelInfo,
  VideoInfo,
  CommentAnalysisResult,
  ChannelInfoRequest,
  CommentAnalysisRequest,
} from '../types/api';

// API 기본 설정
const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// YouTube Data API
export const youtubeDataAPI = {
  // 채널 정보 조회
  getChannelInfo: async (request: ChannelInfoRequest): Promise<APIResponse<ChannelInfo>> => {
    const response = await apiClient.post('/youtube-data/channel/info', request);
    return response.data;
  },

  // 채널 비디오 목록 조회
  getChannelVideos: async (channelId: string, maxResults = 20) => {
    const response = await apiClient.get(`/youtube-data/channel/${channelId}/videos`, {
      params: { max_results: maxResults, order: 'date' }
    });
    return response.data;
  },

  // 비디오 통계 조회
  getVideoStatistics: async (videoId: string): Promise<APIResponse<VideoInfo>> => {
    const response = await apiClient.get(`/youtube-data/video/${videoId}/statistics`);
    return response.data;
  },

  // 채널 검색
  searchChannels: async (query: string, maxResults = 10) => {
    const response = await apiClient.get('/youtube-data/channels/search', {
      params: { q: query, max_results: maxResults }
    });
    return response.data;
  },

  // API 연결 테스트
  testConnection: async () => {
    const response = await apiClient.get('/youtube-data/test');
    return response.data;
  },
};

// Comment Processor API
export const commentProcessorAPI = {
  // 비디오 댓글 분석
  analyzeVideo: async (request: CommentAnalysisRequest): Promise<APIResponse<CommentAnalysisResult>> => {
    const response = await apiClient.post('/processor/analyze-video', request);
    return response.data;
  },

  // 댓글 데이터 직접 분석
  analyzeComments: async (comments: any[], options?: {
    similarity_threshold?: number;
    min_duplicate_count?: number;
  }) => {
    const response = await apiClient.post('/processor/analyze-comments', {
      comments,
      ...options
    });
    return response.data;
  },

  // 텍스트 유사도 계산
  calculateSimilarity: async (text1: string, text2: string) => {
    const response = await apiClient.get(`/processor/similarity/${encodeURIComponent(text1)}/${encodeURIComponent(text2)}`);
    return response.data;
  },

  // 프로세서 설정 조회
  getSettings: async () => {
    const response = await apiClient.get('/processor/settings');
    return response.data;
  },

  // 프로세서 설정 업데이트
  updateSettings: async (settings: {
    similarity_threshold?: number;
    min_duplicate_count?: number;
  }) => {
    const response = await apiClient.put('/processor/settings', settings);
    return response.data;
  },
};

// YouTube Comment Downloader API
export const commentDownloaderAPI = {
  // 댓글 다운로드
  downloadComments: async (request: {
    video_url: string;
    limit?: number;
    language?: string;
    sort_by?: 'top' | 'new';
  }) => {
    const response = await apiClient.post('/youtube/comments/download', request);
    return response.data;
  },

  // 댓글 검색
  searchComments: async (request: {
    video_url: string;
    search_term: string;
    case_sensitive?: boolean;
  }) => {
    const response = await apiClient.post('/youtube/comments/search', request);
    return response.data;
  },

  // 비디오 정보 조회
  getVideoInfo: async (videoUrl: string) => {
    const response = await apiClient.get('/youtube/video/info', {
      params: { video_url: videoUrl }
    });
    return response.data;
  },
};

// 시스템 상태 API
export const systemAPI = {
  // 전체 시스템 상태
  getStatus: async () => {
    const response = await apiClient.get('/status');
    return response.data;
  },

  // 개별 서비스 상태
  getYouTubeHealth: async () => {
    const response = await apiClient.get('/youtube/health');
    return response.data;
  },

  getProcessorHealth: async () => {
    const response = await apiClient.get('/processor/health');
    return response.data;
  },

  getYouTubeDataHealth: async () => {
    const response = await apiClient.get('/youtube-data/health');
    return response.data;
  },

  // 데이터베이스 연결 테스트
  testDatabase: async () => {
    const response = await apiClient.get('/db-test');
    return response.data;
  },
};

export default apiClient;