import { create } from 'zustand';
import type { ChannelInfo, VideoInfo, CommentAnalysisResult } from '../types/api';

// 앱 전체 상태 인터페이스
interface AppState {
  // 채널 관련 상태
  channel: {
    info: ChannelInfo | null;
    videos: VideoInfo[];
    loading: boolean;
    error: string | null;
  };
  
  // 댓글 분석 관련 상태
  analysis: {
    currentVideo: VideoInfo | null;
    results: CommentAnalysisResult | null;
    selectedComments: string[];
    loading: boolean;
    error: string | null;
  };
  
  // 설정
  settings: {
    similarity_threshold: number;
    min_duplicate_count: number;
  };
  
  // UI 상태
  ui: {
    activeTab: string;
    sidebarCollapsed: boolean;
    notifications: Array<{
      id: string;
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      timestamp: number;
    }>;
  };
}

// 액션 인터페이스
interface AppActions {
  // 채널 액션
  setChannelInfo: (info: ChannelInfo | null) => void;
  setChannelVideos: (videos: VideoInfo[]) => void;
  setChannelLoading: (loading: boolean) => void;
  setChannelError: (error: string | null) => void;
  
  // 분석 액션
  setCurrentVideo: (video: VideoInfo | null) => void;
  setAnalysisResults: (results: CommentAnalysisResult | null) => void;
  setSelectedComments: (commentIds: string[]) => void;
  toggleCommentSelection: (commentId: string) => void;
  selectAllComments: (commentIds: string[]) => void;
  clearSelectedComments: () => void;
  setAnalysisLoading: (loading: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  
  // 설정 액션
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  
  // UI 액션
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  addNotification: (notification: Omit<AppState['ui']['notifications'][0], 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // 유틸리티 액션
  resetChannel: () => void;
  resetAnalysis: () => void;
  resetAll: () => void;
}

// 초기 상태
const initialState: AppState = {
  channel: {
    info: null,
    videos: [],
    loading: false,
    error: null,
  },
  analysis: {
    currentVideo: null,
    results: null,
    selectedComments: [],
    loading: false,
    error: null,
  },
  settings: {
    similarity_threshold: 0.8,
    min_duplicate_count: 3,
  },
  ui: {
    activeTab: 'dashboard',
    sidebarCollapsed: false,
    notifications: [],
  },
};

// Zustand 스토어 생성
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  ...initialState,
  
  // 채널 액션 구현
  setChannelInfo: (info) => set((state) => ({
    channel: { ...state.channel, info }
  })),
  
  setChannelVideos: (videos) => set((state) => ({
    channel: { ...state.channel, videos }
  })),
  
  setChannelLoading: (loading) => set((state) => ({
    channel: { ...state.channel, loading }
  })),
  
  setChannelError: (error) => set((state) => ({
    channel: { ...state.channel, error }
  })),
  
  // 분석 액션 구현
  setCurrentVideo: (currentVideo) => set((state) => ({
    analysis: { ...state.analysis, currentVideo }
  })),
  
  setAnalysisResults: (results) => set((state) => ({
    analysis: { ...state.analysis, results }
  })),
  
  setSelectedComments: (selectedComments) => set((state) => ({
    analysis: { ...state.analysis, selectedComments }
  })),
  
  toggleCommentSelection: (commentId) => set((state) => {
    const selected = state.analysis.selectedComments;
    const newSelected = selected.includes(commentId)
      ? selected.filter(id => id !== commentId)
      : [...selected, commentId];
    
    return {
      analysis: { ...state.analysis, selectedComments: newSelected }
    };
  }),
  
  selectAllComments: (commentIds) => set((state) => ({
    analysis: { ...state.analysis, selectedComments: commentIds }
  })),
  
  clearSelectedComments: () => set((state) => ({
    analysis: { ...state.analysis, selectedComments: [] }
  })),
  
  setAnalysisLoading: (loading) => set((state) => ({
    analysis: { ...state.analysis, loading }
  })),
  
  setAnalysisError: (error) => set((state) => ({
    analysis: { ...state.analysis, error }
  })),
  
  // 설정 액션 구현
  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),
  
  // UI 액션 구현
  setActiveTab: (activeTab) => set((state) => ({
    ui: { ...state.ui, activeTab }
  })),
  
  toggleSidebar: () => set((state) => ({
    ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed }
  })),
  
  addNotification: (notification) => set((state) => ({
    ui: {
      ...state.ui,
      notifications: [
        ...state.ui.notifications,
        {
          ...notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
        }
      ]
    }
  })),
  
  removeNotification: (id) => set((state) => ({
    ui: {
      ...state.ui,
      notifications: state.ui.notifications.filter(n => n.id !== id)
    }
  })),
  
  clearNotifications: () => set((state) => ({
    ui: { ...state.ui, notifications: [] }
  })),
  
  // 유틸리티 액션 구현
  resetChannel: () => set((state) => ({
    channel: initialState.channel
  })),
  
  resetAnalysis: () => set((state) => ({
    analysis: initialState.analysis
  })),
  
  resetAll: () => set(() => initialState),
}));

// 유용한 셀렉터들
export const useChannelInfo = () => useAppStore(state => state.channel.info);
export const useChannelVideos = () => useAppStore(state => state.channel.videos);
export const useChannelLoading = () => useAppStore(state => state.channel.loading);

export const useAnalysisResults = () => useAppStore(state => state.analysis.results);
export const useSelectedComments = () => useAppStore(state => state.analysis.selectedComments);
export const useAnalysisLoading = () => useAppStore(state => state.analysis.loading);

export const useSettings = () => useAppStore(state => state.settings);
export const useActiveTab = () => useAppStore(state => state.ui.activeTab);
export const useNotifications = () => useAppStore(state => state.ui.notifications);