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

// SEO 분석 API 서비스
export class SEOAPI {
  static async analyzeChannelSEO(data: {
    channel_id: string;
    percentile_threshold?: number;
    min_videos?: number;
  }): Promise<{ success: boolean; data?: SEOAnalysisData; message: string }> {
    const response = await apiClient.post('/api/v1/seo/analyze', data);
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