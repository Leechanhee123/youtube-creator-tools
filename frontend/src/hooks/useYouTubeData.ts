import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { YouTubeAPI, CommentAPI, ProcessorAPI } from '../services/api';
import type {
  ChannelInfo,
  VideosResponse,
  CommentAnalysisResult,
  ChannelInfoRequest,
  VideoAnalysisRequest,
} from '../types/api';

// 채널 정보 관리 훅
export const useChannelInfo = () => {
  const queryClient = useQueryClient();

  const getChannelInfo = useMutation({
    mutationFn: (request: ChannelInfoRequest) => YouTubeAPI.getChannelInfo(request),
    onSuccess: (data) => {
      queryClient.setQueryData(['channel', data.channel_id], data);
    },
  });

  return {
    getChannelInfo: getChannelInfo.mutate,
    isLoading: getChannelInfo.isPending,
    error: getChannelInfo.error,
    data: getChannelInfo.data,
    isError: getChannelInfo.isError,
    isSuccess: getChannelInfo.isSuccess,
  };
};

// 채널 비디오 목록 관리 훅
export const useChannelVideos = (channelId: string | null) => {
  const [maxResults, setMaxResults] = useState(20);
  const [order, setOrder] = useState<'date' | 'relevance' | 'viewCount'>('date');
  const [pageToken, setPageToken] = useState<string>();

  const query = useQuery({
    queryKey: ['channel-videos', channelId, maxResults, order, pageToken],
    queryFn: () => {
      if (!channelId) throw new Error('Channel ID is required');
      return YouTubeAPI.getChannelVideos(channelId, maxResults, order, pageToken);
    },
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const loadMore = useCallback(() => {
    if (query.data?.next_page_token) {
      setPageToken(query.data.next_page_token);
    }
  }, [query.data?.next_page_token]);

  const changeOrder = useCallback((newOrder: 'date' | 'relevance' | 'viewCount') => {
    setOrder(newOrder);
    setPageToken(undefined);
  }, []);

  const changeMaxResults = useCallback((newMaxResults: number) => {
    setMaxResults(newMaxResults);
    setPageToken(undefined);
  }, []);

  return {
    videos: query.data?.videos || [],
    totalResults: query.data?.total_results || 0,
    nextPageToken: query.data?.next_page_token,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    loadMore,
    changeOrder,
    changeMaxResults,
    hasNextPage: !!query.data?.next_page_token,
    refetch: query.refetch,
  };
};

// 댓글 분석 관리 훅
export const useCommentAnalysis = () => {
  const queryClient = useQueryClient();

  const analyzeVideo = useMutation({
    mutationFn: (request: VideoAnalysisRequest) => ProcessorAPI.analyzeVideo(request),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['comment-analysis', variables.video_url], data);
    },
  });

  return {
    analyzeVideo: analyzeVideo.mutate,
    isLoading: analyzeVideo.isPending,
    error: analyzeVideo.error,
    data: analyzeVideo.data,
    isError: analyzeVideo.isError,
    isSuccess: analyzeVideo.isSuccess,
    reset: analyzeVideo.reset,
  };
};

// 앱 전체 상태 관리 훅
export const useAppState = () => {
  const [appState, setAppState] = useState({
    // 채널 정보
    channel: {
      info: null as ChannelInfo | null,
      videos: [] as VideosResponse['videos'],
      loading: false,
      error: null as string | null,
    },
    
    // 댓글 분석
    analysis: {
      currentVideo: null as string | null,
      results: null as CommentAnalysisResult | null,
      selectedComments: [] as string[],
      loading: false,
      error: null as string | null,
    },
    
    // 설정
    settings: {
      similarity_threshold: 0.8,
      min_duplicate_count: 3,
    },
    
    // UI 상태
    ui: {
      activeTab: 'dashboard' as 'dashboard' | 'videos' | 'analysis' | 'seo' | 'competitor',
      notifications: [] as Array<{
        id: string;
        type: 'success' | 'error' | 'info' | 'warning';
        message: string;
        timestamp: number;
      }>,
    },
  });

  // 채널 정보 업데이트
  const updateChannelInfo = useCallback((info: ChannelInfo) => {
    setAppState(prev => ({
      ...prev,
      channel: {
        ...prev.channel,
        info,
      },
    }));
  }, []);

  // 비디오 목록 업데이트
  const updateChannelVideos = useCallback((videos: VideosResponse['videos']) => {
    setAppState(prev => ({
      ...prev,
      channel: {
        ...prev.channel,
        videos,
      },
    }));
  }, []);

  // 분석 결과 업데이트
  const updateAnalysisResults = useCallback((results: CommentAnalysisResult) => {
    setAppState(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        results,
      },
    }));
  }, []);

  // 선택된 댓글 업데이트
  const updateSelectedComments = useCallback((commentIds: string[]) => {
    setAppState(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        selectedComments: commentIds,
      },
    }));
  }, []);

  // 활성 탭 변경
  const setActiveTab = useCallback((tab: 'dashboard' | 'videos' | 'analysis' | 'seo' | 'competitor') => {
    setAppState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        activeTab: tab,
      },
    }));
  }, []);

  // 알림 추가
  const addNotification = useCallback((
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: Date.now(),
    };

    setAppState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        notifications: [...prev.ui.notifications, notification],
      },
    }));

    // 5초 후 자동 제거
    setTimeout(() => {
      removeNotification(notification.id);
    }, 5000);
  }, []);

  // 알림 제거
  const removeNotification = useCallback((id: string) => {
    setAppState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        notifications: prev.ui.notifications.filter(n => n.id !== id),
      },
    }));
  }, []);

  // 로딩 상태 업데이트
  const setChannelLoading = useCallback((loading: boolean) => {
    setAppState(prev => ({
      ...prev,
      channel: {
        ...prev.channel,
        loading,
      },
    }));
  }, []);

  const setAnalysisLoading = useCallback((loading: boolean) => {
    setAppState(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        loading,
      },
    }));
  }, []);

  // 에러 상태 업데이트
  const setChannelError = useCallback((error: string | null) => {
    setAppState(prev => ({
      ...prev,
      channel: {
        ...prev.channel,
        error,
      },
    }));
  }, []);

  const setAnalysisError = useCallback((error: string | null) => {
    setAppState(prev => ({
      ...prev,
      analysis: {
        ...prev.analysis,
        error,
      },
    }));
  }, []);

  // 설정 업데이트
  const updateSettings = useCallback((newSettings: Partial<typeof appState.settings>) => {
    setAppState(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  }, []);

  return {
    appState,
    // 채널 관련
    updateChannelInfo,
    updateChannelVideos,
    setChannelLoading,
    setChannelError,
    // 분석 관련
    updateAnalysisResults,
    updateSelectedComments,
    setAnalysisLoading,
    setAnalysisError,
    // UI 관련
    setActiveTab,
    addNotification,
    removeNotification,
    // 설정 관련
    updateSettings,
  };
};

// 시스템 상태 관리 훅
export const useSystemStatus = () => {
  const statusQuery = useQuery({
    queryKey: ['system-status'],
    queryFn: () => Promise.all([
      YouTubeAPI.getChannelInfo({ url: 'https://www.youtube.com/@test' }).catch(() => null),
      ProcessorAPI.getSettings().catch(() => null),
    ]),
    refetchInterval: 30000, // 30초마다 상태 확인
    retry: 1,
  });

  return {
    isHealthy: !statusQuery.isError,
    isLoading: statusQuery.isLoading,
    lastChecked: statusQuery.dataUpdatedAt,
    refetch: statusQuery.refetch,
  };
};