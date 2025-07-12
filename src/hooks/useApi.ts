import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  youtubeDataAPI, 
  commentProcessorAPI, 
  commentDownloaderAPI,
  systemAPI 
} from '../services/api';
import { useAppStore } from '../stores/appStore';
import type { ChannelInfoRequest, CommentAnalysisRequest } from '../types/api';

// React Query 키 상수
export const QUERY_KEYS = {
  CHANNEL_INFO: 'channelInfo',
  CHANNEL_VIDEOS: 'channelVideos',
  VIDEO_STATISTICS: 'videoStatistics',
  SEARCH_CHANNELS: 'searchChannels',
  SYSTEM_STATUS: 'systemStatus',
  PROCESSOR_SETTINGS: 'processorSettings',
} as const;

// 채널 정보 조회 훅
export const useChannelInfo = (request: ChannelInfoRequest | null) => {
  const { setChannelInfo, setChannelError } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_INFO, request],
    queryFn: () => youtubeDataAPI.getChannelInfo(request!),
    enabled: !!request && (!!request.channel_id || !!request.username || !!request.handle || !!request.url),
    onSuccess: (data) => {
      if (data.success && data.data) {
        setChannelInfo(data.data);
        setChannelError(null);
      } else {
        setChannelError(data.message);
      }
    },
    onError: (error: any) => {
      setChannelError(error.message || 'Failed to fetch channel info');
    },
  });
};

// 채널 비디오 목록 조회 훅
export const useChannelVideos = (channelId: string | null, maxResults = 20) => {
  const { setChannelVideos, setChannelError } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.CHANNEL_VIDEOS, channelId, maxResults],
    queryFn: () => youtubeDataAPI.getChannelVideos(channelId!, maxResults),
    enabled: !!channelId,
    onSuccess: (data) => {
      if (data.success && data.data?.videos) {
        setChannelVideos(data.data.videos);
        setChannelError(null);
      } else {
        setChannelError(data.message);
      }
    },
    onError: (error: any) => {
      setChannelError(error.message || 'Failed to fetch channel videos');
    },
  });
};

// 비디오 통계 조회 훅
export const useVideoStatistics = (videoId: string | null) => {
  return useQuery({
    queryKey: [QUERY_KEYS.VIDEO_STATISTICS, videoId],
    queryFn: () => youtubeDataAPI.getVideoStatistics(videoId!),
    enabled: !!videoId,
  });
};

// 채널 검색 훅
export const useSearchChannels = (query: string, maxResults = 10) => {
  return useQuery({
    queryKey: [QUERY_KEYS.SEARCH_CHANNELS, query, maxResults],
    queryFn: () => youtubeDataAPI.searchChannels(query, maxResults),
    enabled: query.length > 2, // 3글자 이상일 때만 검색
  });
};

// 댓글 분석 뮤테이션 훅
export const useAnalyzeVideo = () => {
  const { 
    setAnalysisResults, 
    setAnalysisLoading, 
    setAnalysisError,
    addNotification 
  } = useAppStore();
  
  return useMutation({
    mutationFn: (request: CommentAnalysisRequest) => 
      commentProcessorAPI.analyzeVideo(request),
    onMutate: () => {
      setAnalysisLoading(true);
      setAnalysisError(null);
    },
    onSuccess: (data) => {
      setAnalysisLoading(false);
      if (data.success && data.data) {
        setAnalysisResults(data.data);
        addNotification({
          type: 'success',
          message: `분석 완료: ${data.data.suspicious_count}개의 의심스러운 댓글을 발견했습니다.`
        });
      } else {
        setAnalysisError(data.message);
        addNotification({
          type: 'error',
          message: data.message
        });
      }
    },
    onError: (error: any) => {
      setAnalysisLoading(false);
      const errorMessage = error.message || 'Failed to analyze video';
      setAnalysisError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    },
  });
};

// 댓글 다운로드 뮤테이션 훅
export const useDownloadComments = () => {
  const { addNotification } = useAppStore();
  
  return useMutation({
    mutationFn: commentDownloaderAPI.downloadComments,
    onSuccess: (data) => {
      if (data.success) {
        addNotification({
          type: 'success',
          message: `${data.total_count}개의 댓글을 다운로드했습니다.`
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to download comments'
      });
    },
  });
};

// 프로세서 설정 조회 훅
export const useProcessorSettings = () => {
  const { updateSettings } = useAppStore();
  
  return useQuery({
    queryKey: [QUERY_KEYS.PROCESSOR_SETTINGS],
    queryFn: commentProcessorAPI.getSettings,
    onSuccess: (data) => {
      if (data.similarity_threshold && data.min_duplicate_count) {
        updateSettings({
          similarity_threshold: data.similarity_threshold,
          min_duplicate_count: data.min_duplicate_count,
        });
      }
    },
  });
};

// 프로세서 설정 업데이트 뮤테이션 훅
export const useUpdateProcessorSettings = () => {
  const queryClient = useQueryClient();
  const { updateSettings, addNotification } = useAppStore();
  
  return useMutation({
    mutationFn: commentProcessorAPI.updateSettings,
    onSuccess: (data) => {
      if (data.success && data.current_settings) {
        updateSettings(data.current_settings);
        queryClient.invalidateQueries([QUERY_KEYS.PROCESSOR_SETTINGS]);
        addNotification({
          type: 'success',
          message: '설정이 업데이트되었습니다.'
        });
      }
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || 'Failed to update settings'
      });
    },
  });
};

// 시스템 상태 조회 훅
export const useSystemStatus = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_STATUS],
    queryFn: systemAPI.getStatus,
    refetchInterval: 30000, // 30초마다 상태 확인
  });
};

// API 연결 테스트 뮤테이션 훅
export const useTestConnection = () => {
  const { addNotification } = useAppStore();
  
  return useMutation({
    mutationFn: youtubeDataAPI.testConnection,
    onSuccess: (data) => {
      addNotification({
        type: data.success ? 'success' : 'error',
        message: data.message
      });
    },
    onError: (error: any) => {
      addNotification({
        type: 'error',
        message: error.message || 'Connection test failed'
      });
    },
  });
};