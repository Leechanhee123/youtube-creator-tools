/**
 * API 서비스 클라이언트
 */

import axios from 'axios';
import type {
  ChannelInfo,
  VideosResponse,
  CommentAnalysisResult,
  ChannelInfoRequest,
  VideoAnalysisRequest,
  SEOAnalysisData,
  CompetitorAnalysisData
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// API 클라이언트 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// YouTube API 서비스
export class YouTubeAPI {
  static async getChannelInfo(data: ChannelInfoRequest): Promise<ChannelInfo> {
    const response = await apiClient.post('/api/v1/youtube-data/channel/info', data);
    return response.data.data;
  }

  static async getChannelVideos(channelId: string): Promise<VideosResponse> {
    const response = await apiClient.post('/api/v1/youtube-data/channel/videos', {
      channel_id: channelId
    });
    return response.data.data;
  }
}

// 댓글 분석 API 서비스
export class ProcessorAPI {
  static async analyzeComments(data: VideoAnalysisRequest): Promise<CommentAnalysisResult> {
    const response = await apiClient.post('/api/v1/processor/analyze', data);
    return response.data;
  }

  static async analyzeVideo(data: VideoAnalysisRequest): Promise<CommentAnalysisResult> {
    const response = await apiClient.post('/api/v1/processor/analyze', data);
    return response.data;
  }

  static async getSettings(): Promise<any> {
    const response = await apiClient.get('/api/v1/processor/settings');
    return response.data;
  }

  static async updateSettings(settings: any): Promise<any> {
    const response = await apiClient.put('/api/v1/processor/settings', settings);
    return response.data;
  }
}


// Backlinko SEO 분석 API 서비스 (단순화됨)
export class BacklinkoSEOAPI {
  // Backlinko 기반 SEO 분석
  static async analyzeChannel(data: {
    channel_id: string;
    force_channel_type?: string;
    max_videos?: number;
  }): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await apiClient.post('/api/v1/seo/analyze', data);
    return response.data;
  }

  // SEO 설정 가져오기
  static async getConfig(): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await apiClient.get('/api/v1/seo/config');
    return response.data;
  }

  // 채널 타입별 벤치마크
  static async getBenchmarks(channelType: string): Promise<{ success: boolean; data?: any; message: string }> {
    const response = await apiClient.get(`/api/v1/seo/benchmarks/${channelType}`);
    return response.data;
  }
}

// 경쟁사 분석 API 서비스
export class CompetitorAPI {
  static async analyzeCompetitorsSimple(
    targetChannelId: string,
    competitorUrls: string[],
    period: string = '30d'
  ): Promise<{ success: boolean; data?: CompetitorAnalysisData; message: string }> {
    const response = await apiClient.post('/api/v1/competitor/analyze', {
      target_channel_id: targetChannelId,
      competitor_urls: competitorUrls,
      analysis_period: period
    });
    return response.data;
  }
}

// 성과 분석 API 서비스
export class PerformanceAPI {
  static async getComprehensiveAnalysis(data: ChannelInfoRequest & {
    analysis_type?: string;
    analysis_value?: number;
  }): Promise<{
    success: boolean;
    data?: {
      channel_info: any;
      performance_analysis: {
        comprehensive_score: number;
        metrics: {
          recent_performance: any;
          subscription_rate: any;
          content_consistency: any;
          engagement_rate: any;
        };
        analysis_period: string;
        videos_analyzed: number;
        last_updated: string;
      };
    };
    message: string;
  }> {
    const response = await apiClient.post('/api/v1/performance/comprehensive-analysis', data);
    return response.data;
  }
}