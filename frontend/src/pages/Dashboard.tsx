import React, { useState, useCallback, useEffect } from 'react';
import { Tabs, App } from 'antd';
import { 
  BarChartOutlined,
  PlayCircleOutlined,
  TrophyOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useChannelInfo, useChannelVideos, useAppState, useCommentAnalysis } from '../hooks/useYouTubeData';
import type { SEOAnalysisData, CompetitorAnalysisData } from '../types/api';
import { CompetitorAPI } from '../services/api';

// Components (ProtectedRoute 제거 - 개별 기능별로 권한 체크)

// Tab Components
import DashboardTab from './Dashboard/components/DashboardTab';
import VideosTab from './Dashboard/components/VideosTab';
import AnalysisTab from './Dashboard/components/AnalysisTab';
import SEOTab from './Dashboard/components/SEOTab';
import CompetitorTab from './Dashboard/components/CompetitorTab';
import ChannelManagementTab from './Dashboard/components/ChannelManagementTab';

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { isAuthenticated, user, channels } = useAuth();
  const { notification } = App.useApp();
  
  // URL에서 채널 ID 파라미터 읽기
  const urlParams = new URLSearchParams(window.location.search);
  const initialChannelId = urlParams.get('channel_id');
  
  const [channelUrl, setChannelUrl] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(initialChannelId);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [hasAutoAnalyzed, setHasAutoAnalyzed] = useState(false);
  
  // 채널 ID가 변경될 때마다 URL 업데이트
  useEffect(() => {
    if (selectedChannelId) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('channel_id', selectedChannelId);
      window.history.pushState({}, '', newUrl.toString());
    } else {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('channel_id');
      window.history.pushState({}, '', newUrl.toString());
    }
  }, [selectedChannelId]);
  const [analysisSettings, setAnalysisSettings] = useState({
    download_limit: 0 as number | undefined, // 댓글 분석용 기본값 (0이면 전체)
    similarity_threshold: 0.8,
    min_duplicate_count: 3,
  });
  
  const { getChannelInfo, getChannelInfoAsync, isLoading: channelLoading, data: channelData, error: channelError } = useChannelInfo();
  const { videos, isLoading: videosLoading, error: videosError, totalResults } = useChannelVideos(selectedChannelId);
  const { updateChannelInfo, updateChannelVideos, setActiveTab: setAppActiveTab } = useAppState();
  const { analyzeVideo, isLoading: analysisLoading, data: analysisData, error: analysisError, reset: resetAnalysis } = useCommentAnalysis();

  // 분석 데이터 상태 디버깅
  React.useEffect(() => {
    console.log('analysisData 상태 변경:', analysisData);
  }, [analysisData]);
  
  // SEO 분석 상태
  const [seoAnalysisData, setSeoAnalysisData] = useState<SEOAnalysisData | null>(null);
  const [seoAnalysisLoading, setSeoAnalysisLoading] = useState(false);
  const [seoAnalysisError, setSeoAnalysisError] = useState<string | null>(null);

  // 경쟁사 분석 상태
  const [competitorAnalysisData, setCompetitorAnalysisData] = useState<CompetitorAnalysisData | null>(null);
  const [competitorAnalysisLoading, setCompetitorAnalysisLoading] = useState(false);
  const [competitorUrls, setCompetitorUrls] = useState<string[]>(['']);

  // 채널 분석 핸들러
  const handleChannelAnalysis = useCallback(async () => {
    if (!channelUrl.trim()) {
      notification.error({
        message: '입력 오류',
        description: '채널 URL을 입력해주세요.',
      });
      return;
    }
    
    try {
      await getChannelInfoAsync({ url: channelUrl.trim() });
    } catch (error) {
      console.error('Channel analysis error:', error);
    }
  }, [channelUrl, getChannelInfoAsync]);

  // URL에서 채널 ID가 있는 경우 자동 분석 시작
  useEffect(() => {
    if (initialChannelId && !channelData && !hasAutoAnalyzed) {
      const channelUrl = `https://www.youtube.com/channel/${initialChannelId}`;
      setChannelUrl(channelUrl);
      
      getChannelInfoAsync({ url: channelUrl }).then(() => {
        setHasAutoAnalyzed(true);
        notification.success({
          message: '채널 분석 완료',
          description: 'URL 파라미터의 채널이 자동으로 분석되었습니다.',
        });
      }).catch((error) => {
        console.error('URL 채널 분석 실패:', error);
        notification.error({
          message: '채널 분석 실패',
          description: '채널 분석을 수동으로 시작해주세요.',
        });
      });
    }
  }, [initialChannelId, channelData, hasAutoAnalyzed, getChannelInfoAsync]);

  // 로그인한 사용자의 채널 자동 분석 (URL 파라미터가 없는 경우에만)
  useEffect(() => {
    if (isAuthenticated && channels && channels.length > 0 && !hasAutoAnalyzed && !channelData && !initialChannelId) {
      const firstChannel = channels[0];
      // 채널 URL 형식으로 변환
      const channelUrl = `https://www.youtube.com/channel/${firstChannel.channel_id}`;
      setChannelUrl(channelUrl);
      
      // 로그인한 사용자는 채널 관리 탭으로 이동
      setActiveTab('management');
      setAppActiveTab('management');
      
      // 자동 분석 시작
      getChannelInfoAsync({ url: channelUrl }).then(() => {
        setHasAutoAnalyzed(true);
        notification.success({
          message: '자동 채널 분석 완료',
          description: `${firstChannel.title} 채널이 자동으로 분석되었습니다.`,
        });
      }).catch((error) => {
        console.error('자동 채널 분석 실패:', error);
        notification.error({
          message: '자동 채널 분석 실패',
          description: '채널 분석을 수동으로 시작해주세요.',
        });
      });
    }
  }, [isAuthenticated, channels, hasAutoAnalyzed, channelData, getChannelInfoAsync, setAppActiveTab, initialChannelId]);

  // 채널 데이터 업데이트 시 처리
  useEffect(() => {
    if (channelData) {
      updateChannelInfo(channelData);
      setSelectedChannelId(channelData.channel_id);
      
      // 로그인한 사용자가 아닌 경우에만 비디오 탭으로 이동
      if (!isAuthenticated) {
        setActiveTab('videos');
        setAppActiveTab('videos');
      }
      
      // 자동 분석이 아닌 경우에만 알림 표시
      if (!hasAutoAnalyzed) {
        notification.success({
          message: '채널 분석 완료',
          description: `${channelData.title} 채널 정보를 성공적으로 가져왔습니다.`,
        });
      }
    }
  }, [channelData, updateChannelInfo, setAppActiveTab, hasAutoAnalyzed, isAuthenticated]);

  // 비디오 데이터 업데이트 시 처리
  useEffect(() => {
    if (videos.length > 0) {
      updateChannelVideos(videos);
    }
  }, [videos, updateChannelVideos]);

  // 에러 처리
  useEffect(() => {
    if (channelError) {
      notification.error({
        message: '채널 분석 실패',
        description: channelError.message || '채널 정보를 가져오는데 실패했습니다.',
      });
    }
  }, [channelError]);

  useEffect(() => {
    if (videosError) {
      notification.error({
        message: '비디오 목록 로드 실패',
        description: videosError.message || '비디오 목록을 가져오는데 실패했습니다.',
      });
    }
  }, [videosError]);

  // 비디오 분석 핸들러
  const handleVideoAnalysis = useCallback((videoUrl: string) => {
    setActiveTab('analysis');
    setAppActiveTab('analysis');
    
    // 댓글 분석 시작
    analyzeVideo({
      video_url: videoUrl,
      ...analysisSettings,
    });
  }, [setAppActiveTab, analyzeVideo, analysisSettings]);

  // 댓글 삭제 핸들러 (향후 구현)
  const handleDeleteComments = useCallback((commentIds: string[]) => {
    // TODO: 댓글 삭제 API 구현
    console.log('Deleting comments:', commentIds);
    notification.info({
      message: '댓글 삭제 기능',
      description: '댓글 삭제 기능은 OAuth 2.0 인증 구현 후 제공됩니다.',
    });
  }, []);

  // 분석 리셋 핸들러
  const handleResetAnalysis = useCallback(() => {
    console.log('분석 리셋 요청됨. 현재 analysisData:', analysisData);
    resetAnalysis();
    console.log('resetAnalysis 함수 호출됨');
    
    // 리셋 후 상태 확인을 위한 타이머
    setTimeout(() => {
      console.log('리셋 후 analysisData 상태:', analysisData);
    }, 100);
  }, [resetAnalysis, analysisData]);

  // 분석 결과 처리
  useEffect(() => {
    if (analysisData && analysisData.total_comments !== undefined && analysisData.suspicious_count !== undefined) {
      notification.success({
        message: '댓글 분석 완료',
        description: `총 ${analysisData.total_comments}개 댓글 중 ${analysisData.suspicious_count}개의 의심 댓글을 발견했습니다.`,
      });
    }
  }, [analysisData]);

  // 분석 에러 처리
  useEffect(() => {
    if (analysisError) {
      notification.error({
        message: '댓글 분석 실패',
        description: analysisError.message || '댓글 분석에 실패했습니다.',
      });
    }
  }, [analysisError]);

  // SEO 분석 핸들러
  const handleSEOAnalysis = useCallback(async () => {
    if (!selectedChannelId) {
      notification.error({
        message: 'SEO 분석 실패',
        description: '먼저 채널을 선택해주세요.',
      });
      return;
    }

    setSeoAnalysisLoading(true);
    setSeoAnalysisError(null);
    
    try {
      const response = await SEOAPI.analyzeChannelSEO({
        channel_id: selectedChannelId,
        percentile_threshold: 0.2,
        min_videos: 10,
      });

      if (response.success && response.data) {
        setSeoAnalysisData(response.data);
        setActiveTab('seo');
        setAppActiveTab('seo');
        
        notification.success({
          message: 'SEO 분석 완료',
          description: `${response.data.total_videos}개 비디오의 SEO 분석이 완료되었습니다.`,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'SEO 분석 중 오류가 발생했습니다.';
      setSeoAnalysisError(errorMessage);
      notification.error({
        message: 'SEO 분석 실패',
        description: errorMessage,
      });
    } finally {
      setSeoAnalysisLoading(false);
    }
  }, [selectedChannelId, setActiveTab, setAppActiveTab]);

  // 경쟁사 URL 관리 함수들
  const addCompetitorUrl = () => {
    setCompetitorUrls([...competitorUrls, '']);
  };

  const removeCompetitorUrl = (index: number) => {
    if (competitorUrls.length > 1) {
      const newUrls = competitorUrls.filter((_, i) => i !== index);
      setCompetitorUrls(newUrls);
    }
  };

  const updateCompetitorUrl = (index: number, value: string) => {
    const newUrls = [...competitorUrls];
    newUrls[index] = value;
    setCompetitorUrls(newUrls);
  };

  // 뒤로가기 함수
  const goBackToDashboard = () => {
    setActiveTab('dashboard');
    setAppActiveTab('dashboard');
  };

  // 완전 초기화 함수 (로그인 상태 및 채널 관리 탭 유지)
  const resetToInitialState = useCallback(() => {
    setChannelUrl('');
    setSelectedChannelId(null);
    setSeoAnalysisData(null);
    setCompetitorAnalysisData(null);
    setCompetitorUrls(['']);
    setHasAutoAnalyzed(false); // 자동 분석 상태 초기화
    
    // 새로 시작 시 모든 사용자가 대시보드 탭으로 이동
    setActiveTab('dashboard');
    setAppActiveTab('dashboard');
    
    // URL 파라미터 초기화
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('channel_id');
    window.history.pushState({}, '', newUrl.toString());
    
    // 채널 데이터 초기화
    updateChannelInfo(null);
    updateChannelVideos([]);
    
    // 성공 알림
    notification.success({
      message: '초기화 완료',
      description: '새로운 채널 분석을 시작할 수 있습니다.',
    });
  }, [isAuthenticated, setAppActiveTab, updateChannelInfo, updateChannelVideos]);

  // 경쟁사 분석 핸들러
  const handleCompetitorAnalysis = useCallback(async () => {
    console.log('경쟁사 분석 버튼 클릭됨!');
    console.log('selectedChannelId:', selectedChannelId);
    console.log('competitorUrls:', competitorUrls);
    
    if (!selectedChannelId) {
      notification.error({
        message: '경쟁사 분석 실패',
        description: '먼저 채널을 선택해주세요.',
      });
      return;
    }

    setCompetitorAnalysisLoading(true);
    
    // 유효한 URL만 필터링
    const validUrls = competitorUrls.filter(url => url.trim() !== '');
    
    if (validUrls.length === 0) {
      notification.error({
        message: '경쟁사 URL 필요',
        description: '적어도 하나의 경쟁사 URL을 입력해주세요.',
      });
      setCompetitorAnalysisLoading(false);
      return;
    }

    try {
      const response = await CompetitorAPI.analyzeCompetitorsSimple(
        selectedChannelId,
        validUrls,
        '30d'
      );

      if (response.success && response.data) {
        setCompetitorAnalysisData(response.data);
        setActiveTab('competitor');
        setAppActiveTab('competitor');
        
        notification.success({
          message: '경쟁사 분석 완료',
          description: `${response.data.competitors.length}개 경쟁 채널 분석이 완료되었습니다.`,
        });
      } else {
        throw new Error(response.message);
      }
    } catch (error: any) {
      const errorMessage = error.message || '경쟁사 분석 중 오류가 발생했습니다.';
      notification.error({
        message: '경쟁사 분석 실패',
        description: errorMessage,
      });
    } finally {
      setCompetitorAnalysisLoading(false);
    }
  }, [selectedChannelId, competitorUrls, setActiveTab, setAppActiveTab]);

  // SEO 분석 에러 처리
  useEffect(() => {
    if (seoAnalysisError) {
      notification.error({
        message: 'SEO 분석 실패',
        description: seoAnalysisError,
      });
    }
  }, [seoAnalysisError]);

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <BarChartOutlined />
          {t('nav.dashboard')}
        </span>
      ),
      children: (
        <DashboardTab
          channelUrl={channelUrl}
          setChannelUrl={setChannelUrl}
          channelData={channelData || null}
          channelLoading={channelLoading}
          videos={videos}
          totalResults={totalResults}
          seoAnalysisData={seoAnalysisData}
          competitorAnalysisData={competitorAnalysisData}
          onChannelAnalysis={handleChannelAnalysis}
          onSEOAnalysis={handleSEOAnalysis}
          onCompetitorAnalysis={handleCompetitorAnalysis}
          onReset={resetToInitialState}
          seoAnalysisLoading={seoAnalysisLoading}
          competitorAnalysisLoading={competitorAnalysisLoading}
        />
      ),
    },
    {
      key: 'videos',
      label: (
        <span>
          <PlayCircleOutlined />
          {t('nav.videos')}
        </span>
      ),
      children: (
        <VideosTab
          selectedChannelId={selectedChannelId}
          videos={videos}
          videosLoading={videosLoading}
          totalResults={totalResults}
          onVideoAnalysis={handleVideoAnalysis}
        />
      ),
    },
    {
      key: 'analysis',
      label: (
        <span>
          <BarChartOutlined />
          {t('nav.analysis')}
        </span>
      ),
      children: (
        <AnalysisTab
          analysisLoading={analysisLoading}
          analysisData={analysisData || null}
          videos={videos}
          analysisSettings={analysisSettings}
          setAnalysisSettings={setAnalysisSettings}
          onVideoAnalysis={handleVideoAnalysis}
          onDeleteComments={handleDeleteComments}
          onResetAnalysis={handleResetAnalysis}
        />
      ),
    },
    {
      key: 'seo',
      label: (
        <span>
          <TrophyOutlined />
          {t('nav.seo')}
        </span>
      ),
      children: (
        <SEOTab
          selectedChannelId={selectedChannelId}
          seoAnalysisLoading={seoAnalysisLoading}
          seoAnalysisData={seoAnalysisData}
          videos={videos}
          totalResults={totalResults}
          onSEOAnalysis={handleSEOAnalysis}
          onGoBack={goBackToDashboard}
        />
      ),
    },
    {
      key: 'competitor',
      label: (
        <span>
          <TrophyOutlined />
          {t('nav.competitor')}
        </span>
      ),
      children: (
        <CompetitorTab
          selectedChannelId={selectedChannelId}
          competitorAnalysisLoading={competitorAnalysisLoading}
          competitorAnalysisData={competitorAnalysisData}
          competitorUrls={competitorUrls}
          onCompetitorAnalysis={handleCompetitorAnalysis}
          onGoBack={goBackToDashboard}
          addCompetitorUrl={addCompetitorUrl}
          removeCompetitorUrl={removeCompetitorUrl}
          updateCompetitorUrl={updateCompetitorUrl}
        />
      ),
    },
    {
      key: 'management',
      label: (
        <span>
          <SettingOutlined />
          {t('nav.management')}
        </span>
      ),
      children: (
        <ChannelManagementTab
          channelData={channelData || null}
          onChannelAnalysis={handleChannelAnalysis}
          channelLoading={channelLoading}
        />
      ),
    },
  ];

  return (
    <div className="full-width-container">
      <div className="main-content-full">
        <Tabs 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="full-width-tabs modern-tabs"
          style={{
            background: 'transparent',
            width: '100%',
          }}
          tabBarStyle={{
            marginBottom: '24px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '8px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
          }}
        />
      </div>
    </div>
  );
};

export default Dashboard;