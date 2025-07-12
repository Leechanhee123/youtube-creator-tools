// API 응답 타입 정의
export interface APIResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

// 채널 정보 타입
export interface ChannelInfo {
  channel_id: string;
  title: string;
  description: string;
  custom_url?: string;
  published_at?: string;
  statistics: {
    view_count: number;
    subscriber_count: number;
    video_count: number;
  };
  thumbnails: {
    default?: { url: string };
    medium?: { url: string };
    high?: { url: string };
  };
}

// 비디오 정보 타입
export interface VideoInfo {
  video_id: string;
  title: string;
  description: string;
  published_at: string;
  video_url: string;
  thumbnails: Record<string, { url: string }>;
  channel_id: string;
  channel_title: string;
}

// 댓글 데이터 타입
export interface CommentData {
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

// 유사 댓글 그룹 타입
export interface SimilarGroup {
  representative_text: string;
  similar_count: number;
  comment_ids: string[];
  authors: string[];
  similarity_samples: Array<{
    text: string;
    similarity: number;
  }>;
}

// 댓글 분석 결과 타입
export interface CommentAnalysisResult {
  total_comments: number;
  suspicious_count: number;
  duplicate_groups: {
    exact_duplicates: {
      count: number;
      groups: DuplicateGroup[];
    };
    similar_groups: {
      count: number;
      groups: SimilarGroup[];
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
  channel_id?: string;
  username?: string;
  handle?: string;
  url?: string;
}

export interface CommentAnalysisRequest {
  video_url: string;
  download_limit?: number;
  similarity_threshold?: number;
  min_duplicate_count?: number;
}