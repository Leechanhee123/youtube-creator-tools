// API 응답 타입 정의
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

// 채널 정보 타입
export interface ChannelInfo {
  channel_id: string;
  title: string;
  description: string;
  custom_url?: string;
  published_at: string;
  statistics: {
    view_count: number;
    subscriber_count: number;
    video_count: number;
  };
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

// 비디오 정보 타입
export interface VideoInfo {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  video_url: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics?: {
    view_count: number;
    like_count: number;
    comment_count: number;
  };
}

// 비디오 목록 응답 타입
export interface VideosResponse {
  videos: VideoInfo[];
  total_results: number;
  next_page_token?: string;
}

// 댓글 정보 타입
export interface CommentInfo {
  comment_id: string;
  text: string;
  author: string;
  author_id: string;
  timestamp: string;
  like_count: number;
  reply_count: number;
  is_favorited: boolean;
  is_reply: boolean;
  parent_id?: string;
}

// 중복 댓글 그룹 타입
export interface DuplicateGroup {
  text_sample: string;
  duplicate_count: number;
  comment_ids: string[];
  authors: string[];
}

// 댓글 분석 결과 타입
export interface CommentAnalysisResult {
  video_id: string;
  total_comments: number;
  suspicious_count: number;
  duplicate_groups: {
    exact_duplicates: {
      count: number;
      groups: DuplicateGroup[];
    };
    similar_groups: {
      count: number;
      groups: DuplicateGroup[];
    };
  };
  spam_patterns: {
    exact_duplicates: number;
    similar_groups: number;
    suspicious_authors: Array<{
      author: string;
      count: number;
    }>;
    short_repetitive: number;
    emoji_spam: number;
    link_spam: number;
  };
  suspicious_comment_ids: string[];
  processing_summary: {
    exact_duplicate_groups: number;
    similar_groups: number;
    suspicious_authors: number;
    spam_indicators: {
      short_repetitive: number;
      emoji_only: number;
      contains_links: number;
    };
  };
}

// API 요청 타입들
export interface ChannelInfoRequest {
  url?: string;
  channel_id?: string;
  username?: string;
  handle?: string;
}

export interface VideoAnalysisRequest {
  video_url: string;
  download_limit?: number;
  similarity_threshold?: number;
  min_duplicate_count?: number;
}

export interface CommentDownloadRequest {
  video_url: string;
  limit?: number;
  language?: string;
  sort_by?: 'top' | 'new';
}

// SEO 분석 관련 타입들
export interface SEOAnalysisRequest {
  channel_id: string;
  percentile_threshold?: number;
  min_videos?: number;
}

export interface VideoStatistics {
  avg_views: number;
  median_views: number;
  avg_likes: number;
  avg_comments: number;
  total_views: number;
}

export interface KeywordUsage {
  attention_grabbing: number;
  question_words: number;
  trending_words: number;
  emotional_words: number;
}

export interface SpecialChars {
  exclamation: number;
  question: number;
  brackets: number;
  quotes: number;
  numbers: number;
}

export interface TitleAnalysis {
  avg_length: number;
  avg_word_count: number;
  max_length: number;
  min_length: number;
  keyword_usage: KeywordUsage;
  special_chars: SpecialChars;
  total_titles: number;
}

export interface DescriptionAnalysis {
  avg_length: number;
  avg_lines: number;
  avg_links: number;
  avg_hashtags: number;
  max_length: number;
  has_description_ratio: number;
}

export interface UploadTimeAnalysis {
  most_common_hour: { hour: number; count: number };
  most_common_day: { day: number; day_name: string; count: number };
  hour_distribution: Record<string, number>;
  day_distribution: Record<string, number>;
  month_distribution: Record<string, number>;
}

export interface VideoGroupAnalysis {
  group_name: string;
  video_count: number;
  statistics: VideoStatistics;
  title_analysis: TitleAnalysis;
  description_analysis: DescriptionAnalysis;
  upload_time_analysis: UploadTimeAnalysis;
}

export interface ViewPerformance {
  top_avg_views: number;
  bottom_avg_views: number;
  performance_gap: number;
}

export interface TitleDifferences {
  length_diff: number;
  word_count_diff: number;
  keyword_usage_diff: Record<string, number>;
}

export interface DescriptionDifferences {
  length_diff: number;
  link_usage_diff: number;
  hashtag_usage_diff: number;
}

export interface GroupComparison {
  view_performance: ViewPerformance;
  title_differences: TitleDifferences;
  description_differences: DescriptionDifferences;
  timing_differences: Record<string, any>;
}

export interface SEORecommendation {
  category: string;
  type: string;
  priority: 'high' | 'medium' | 'low';
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
}

export interface SEOAnalysisData {
  total_videos: number;
  analysis_groups: {
    top_videos: {
      count: number;
      analysis: VideoGroupAnalysis;
    };
    bottom_videos: {
      count: number;
      analysis: VideoGroupAnalysis;
    };
  };
  comparison: GroupComparison;
  recommendations: SEORecommendation[];
  percentile_threshold: number;
}

export interface SEOAnalysisResponse {
  success: boolean;
  message: string;
  data?: SEOAnalysisData;
}

// 경쟁사 분석 관련 타입들
export interface CompetitorAnalysisRequest {
  target_channel_id: string;
  analysis_period?: string; // '7d' | '30d' | '90d'
  max_competitors?: number;
}

export interface PerformanceComparison {
  subscriber_ratio: number;
  view_ratio: number;
  video_ratio: number;
  avg_views_per_video_ratio: number;
}

export interface ContentInsights {
  avg_title_length: number;
  common_title_patterns: string[];
  upload_pattern: {
    most_common_upload_day?: string;
    avg_upload_hour?: number;
    upload_frequency: string;
  };
  recent_video_count: number;
}

export interface ChannelStats {
  subscriber_count: number;
  view_count: number;
  video_count: number;
}

export interface CompetitorInfo {
  channel_id: string;
  title: string;
  similarity_score: number;
  performance_comparison: PerformanceComparison;
  content_insights: ContentInsights;
  channel_stats: ChannelStats;
}

export interface StrategicRecommendation {
  priority: 'high' | 'medium' | 'low';
  type: string;
  suggestion: string;
  impact: string;
}

export interface MarketInsights {
  market_position: 'top' | 'middle' | 'bottom';
  total_competitors_analyzed: number;
  growth_opportunities: string[];
  market_avg_subscribers: number;
  competitive_advantage: string;
}

export interface TargetChannelInfo {
  channel_id: string;
  title: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
  topic_categories: string[];
}

export interface AnalysisMetadata {
  analysis_period: string;
  analyzed_at: string;
  total_competitors_found: number;
}

export interface CompetitorAnalysisData {
  target_channel: TargetChannelInfo;
  competitors: CompetitorInfo[];
  strategic_recommendations: StrategicRecommendation[];
  market_insights: MarketInsights;
  analysis_metadata: AnalysisMetadata;
}

export interface CompetitorAnalysisResponse {
  success: boolean;
  message: string;
  data?: CompetitorAnalysisData;
}

export interface ChannelSEOSummary {
  channel_id: string;
  total_videos: number;
  avg_views_top_group: number;
  avg_views_bottom_group: number;
  performance_gap: number;
  top_recommendations: SEORecommendation[];
  analysis_date: string;
}