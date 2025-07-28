import { useState, useCallback } from 'react';
import { BacklinkoSEOAPI } from '../services/api';

interface AdvancedSEOState {
  isLoading: boolean;
  data: any | null;
  error: string | null;
}

interface AdvancedSEOConfig {
  presets: any[];
  channelTypes: any[];
  keywordCategories: any[];
  defaultConfig: any | null;
}

export const useAdvancedSEO = () => {
  const [state, setState] = useState<AdvancedSEOState>({
    isLoading: false,
    data: null,
    error: null,
  });

  const [config, setConfig] = useState<AdvancedSEOConfig>({
    presets: [],
    channelTypes: [],
    keywordCategories: [],
    defaultConfig: null,
  });

  const [configLoading, setConfigLoading] = useState(false);

  // Backlinko SEO 분석 실행
  const analyzeAdvanced = useCallback(async (params: {
    channelId: string;
    forceChannelType?: string;
    maxVideos?: number;
  }) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await BacklinkoSEOAPI.analyzeChannel({
        channel_id: params.channelId,
        force_channel_type: params.forceChannelType,
        max_videos: params.maxVideos ?? 50,
      });

      if (response.success) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: response.data,
          error: null,
        }));
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '분석 중 오류가 발생했습니다.';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw new Error(errorMessage);
    }
  }, []);

  // Backlinko 벤치마크 가져오기
  const getBenchmarks = useCallback(async (channelType: string) => {
    try {
      const response = await BacklinkoSEOAPI.getBenchmarks(channelType);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || '벤치마크 조회 중 오류가 발생했습니다.';
      throw new Error(errorMessage);
    }
  }, []);

  // SEO 설정 로드
  const loadConfig = useCallback(async () => {
    setConfigLoading(true);
    
    try {
      const response = await BacklinkoSEOAPI.getConfig();
      
      if (response.success) {
        setConfig({
          presets: [],
          channelTypes: response.data?.supported_channel_types || [],
          keywordCategories: [],
          defaultConfig: response.data?.config || null,
        });
      }
    } catch (error: any) {
      console.error('Failed to load SEO config:', error);
    } finally {
      setConfigLoading(false);
    }
  }, []);


  // 분석 데이터 초기화
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
    });
  }, []);

  return {
    // 상태
    isLoading: state.isLoading,
    data: state.data,
    error: state.error,
    
    // 설정
    config,
    configLoading,
    
    // 메서드
    analyzeAdvanced,
    getBenchmarks,
    loadConfig,
    reset,
  };
};

export default useAdvancedSEO;