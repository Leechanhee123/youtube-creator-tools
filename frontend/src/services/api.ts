import axios from 'axios';
import type {
  ApiResponse,
  ChannelInfo,
  VideosResponse,
  CommentAnalysisResult,
  ChannelInfoRequest,
  VideoAnalysisRequest,
  CommentDownloadRequest,
  CommentInfo,
  VideoInfo,
  SEOAnalysisRequest,
  SEOAnalysisResponse,
  ChannelSEOSummary,
  CompetitorAnalysisRequest,
  CompetitorAnalysisResponse
} from '../types/api';

// API 베이스 URL
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 응답 인터셉터 설정
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class YouTubeAPI {
  // 채널 정보 조회
  static async getChannelInfo(request: ChannelInfoRequest): Promise<ChannelInfo> {
    // URL 그대로 전송 (백엔드에서 처리)
    const encodedRequest = {
      ...request
    };
    
    const response = await apiClient.post<ApiResponse<ChannelInfo>>(
      '/youtube-data/channel/info',
      encodedRequest
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 채널 비디오 목록 조회
  static async getChannelVideos(
    channelId: string,
    maxResults: number = 20,
    order: 'date' | 'relevance' | 'viewCount' = 'date',
    pageToken?: string
  ): Promise<VideosResponse> {
    const params = new URLSearchParams({
      max_results: maxResults.toString(),
      order,
      ...(pageToken && { page_token: pageToken }),
    });

    const response = await apiClient.get<ApiResponse<VideosResponse>>(
      `/youtube-data/channel/${channelId}/videos?${params}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 비디오 상세 통계 조회
  static async getVideoStatistics(videoId: string): Promise<VideoInfo> {
    const response = await apiClient.get<ApiResponse<VideoInfo>>(
      `/youtube-data/video/${videoId}/statistics`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 채널 검색
  static async searchChannels(
    query: string,
    maxResults: number = 10
  ): Promise<ChannelInfo[]> {
    const params = new URLSearchParams({
      q: query,
      max_results: maxResults.toString(),
    });

    const response = await apiClient.get<ApiResponse<{ channels: ChannelInfo[] }>>(
      `/youtube-data/channels/search?${params}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!.channels;
  }
}

export class CommentAPI {
  // 댓글 다운로드
  static async downloadComments(request: CommentDownloadRequest): Promise<{
    video_info: { video_id: string; video_url: string; has_comments: boolean };
    comments: CommentInfo[];
    total_count: number;
  }> {
    // URL 그대로 전송 (백엔드에서 처리)
    
    const response = await apiClient.post<ApiResponse<{
      video_info: { video_id: string; video_url: string; has_comments: boolean };
      comments: CommentInfo[];
      total_count: number;
    }>>(
      '/youtube/comments/download',
      request
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 댓글 검색
  static async searchComments(
    videoUrl: string,
    searchTerm: string,
    caseSensitive: boolean = false
  ): Promise<CommentInfo[]> {
    const response = await apiClient.post<ApiResponse<{ comments: CommentInfo[] }>>(
      '/youtube/comments/search',
      {
        video_url: videoUrl,
        search_term: searchTerm,
        case_sensitive: caseSensitive,
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!.comments;
  }

  // 비디오 정보 조회
  static async getVideoInfo(videoUrl: string): Promise<any> {
    const params = new URLSearchParams({ video_url: videoUrl });
    const response = await apiClient.get<ApiResponse<any>>(
      `/youtube/video/info?${params}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }
}

export class ProcessorAPI {
  // 영상 댓글 전체 분석
  static async analyzeVideo(request: VideoAnalysisRequest): Promise<CommentAnalysisResult> {
    // URL 그대로 전송 (백엔드에서 처리)
    
    const response = await apiClient.post<CommentAnalysisResult>(
      '/processor/analyze-video',
      request
    );
    
    console.log('Analysis response:', response.data); // 디버깅용
    console.log('Duplicate groups:', response.data.duplicate_groups); // 중복 그룹 확인
    console.log('Spam patterns:', response.data.spam_patterns); // 스팸 패턴 확인
    
    // 백엔드에서 직접 CommentProcessResponse를 반환하므로 data 필드가 없음
    return response.data;
  }

  // 댓글 데이터 직접 분석
  static async analyzeComments(
    comments: CommentInfo[],
    similarityThreshold: number = 0.8,
    minDuplicateCount: number = 3
  ): Promise<CommentAnalysisResult> {
    const response = await apiClient.post<ApiResponse<CommentAnalysisResult>>(
      '/processor/analyze-comments',
      {
        comments,
        similarity_threshold: similarityThreshold,
        min_duplicate_count: minDuplicateCount,
      }
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 텍스트 유사도 계산
  static async calculateSimilarity(
    text1: string,
    text2: string
  ): Promise<{
    similarity: number;
    is_similar: boolean;
    threshold: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      similarity: number;
      is_similar: boolean;
      threshold: number;
    }>>(
      `/processor/similarity/${encodeURIComponent(text1)}/${encodeURIComponent(text2)}`
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 분석 설정 조회
  static async getSettings(): Promise<{
    similarity_threshold: number;
    min_duplicate_count: number;
  }> {
    const response = await apiClient.get<ApiResponse<{
      similarity_threshold: number;
      min_duplicate_count: number;
    }>>('/processor/settings');
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
    
    return response.data.data!;
  }

  // 분석 설정 수정
  static async updateSettings(settings: {
    similarity_threshold?: number;
    min_duplicate_count?: number;
  }): Promise<void> {
    const response = await apiClient.put<ApiResponse<void>>(
      '/processor/settings',
      settings
    );
    
    if (!response.data.success) {
      throw new Error(response.data.message);
    }
  }
}

export class SystemAPI {
  // 서비스 상태 확인
  static async checkStatus(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/status');
    return response.data;
  }

  // YouTube 다운로더 상태 확인
  static async checkYouTubeHealth(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/youtube/health');
    return response.data;
  }

  // 프로세서 상태 확인
  static async checkProcessorHealth(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/processor/health');
    return response.data;
  }

  // YouTube Data API 상태 확인
  static async checkYouTubeDataHealth(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/youtube-data/health');
    return response.data;
  }

  // YouTube API 키 테스트
  static async testYouTubeAPI(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/youtube-data/test');
    return response.data;
  }

  // 데이터베이스 연결 상태 확인
  static async checkDatabaseHealth(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/db-test');
    return response.data;
  }
}

// WebSocket 연결 관리
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string = 'ws://localhost:8000/ws',
    private onMessage?: (data: any) => void,
    private onError?: (error: Event) => void,
    private onOpen?: () => void,
    private onClose?: () => void
  ) {}

  connect(): void {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.onOpen?.();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.onClose?.();
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError?.(error);
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export class SEOAPI {
  // 채널 SEO 분석
  static async analyzeChannelSEO(request: SEOAnalysisRequest): Promise<SEOAnalysisResponse> {
    const response = await apiClient.post<SEOAnalysisResponse>(
      '/seo/analyze-channel',
      request
    );
    
    console.log('SEO Analysis response:', response.data); // 디버깅용
    
    return response.data;
  }

  // 채널 SEO 요약 정보
  static async getChannelSEOSummary(channelId: string): Promise<{
    success: boolean;
    message: string;
    summary?: ChannelSEOSummary;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      summary?: ChannelSEOSummary;
    }>(`/seo/channel/${channelId}/summary`);
    
    return response.data;
  }

  // SEO 서비스 상태 확인
  static async checkSEOHealth(): Promise<any> {
    const response = await apiClient.get<ApiResponse<any>>('/seo/health');
    return response.data;
  }
}

export class CompetitorAPI {
  // 경쟁사 분석 실행
  static async analyzeCompetitors(request: CompetitorAnalysisRequest): Promise<CompetitorAnalysisResponse> {
    const response = await apiClient.post<CompetitorAnalysisResponse>(
      '/competitor/analyze',
      request
    );
    
    console.log('Competitor Analysis response:', response.data); // 디버깅용
    
    return response.data;
  }

  // 간단한 경쟁사 분석 (GET 방식)
  static async analyzeCompetitorsSimple(
    channelId: string, 
    competitorUrls: string[],
    analysisPeriod: string = '30d'
  ): Promise<CompetitorAnalysisResponse> {
    const response = await apiClient.post<CompetitorAnalysisResponse>(
      '/competitor/analyze',
      {
        target_channel_id: channelId,
        competitor_urls: competitorUrls,
        analysis_period: analysisPeriod
      }
    );
    
    console.log('Simple Competitor Analysis response:', response.data); // 디버깅용
    
    return response.data;
  }

  // 경쟁사 분석 서비스 상태 확인
  static async checkHealth(): Promise<{ 
    success: boolean; 
    message: string; 
    timestamp: string;
    service: string;
    version: string;
  }> {
    const response = await apiClient.get<{ 
      success: boolean; 
      message: string; 
      timestamp: string;
      service: string;
      version: string;
    }>('/competitor/health');
    return response.data;
  }
}

export default {
  YouTubeAPI,
  CommentAPI,
  ProcessorAPI,
  SystemAPI,
  SEOAPI,
  CompetitorAPI,
  WebSocketManager,
};