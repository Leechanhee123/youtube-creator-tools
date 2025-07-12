import React, { useState, useCallback, useEffect } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Statistic,
  Alert,
  Tabs,
  notification,
  Table,
  Tag,
  Avatar,
  Descriptions,
  Spin,
  InputNumber,
  Tooltip,
  Collapse,
  Form
} from 'antd';
import { 
  YoutubeOutlined, 
  SearchOutlined, 
  BarChartOutlined,
  PlayCircleOutlined,
  UserOutlined,
  EyeOutlined,
  CommentOutlined,
  CalendarOutlined,
  SettingOutlined,
  TrophyOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  ArrowLeftOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useChannelInfo, useChannelVideos, useAppState, useCommentAnalysis } from '../hooks/useYouTubeData';
import type { ChannelInfo, VideoInfo, SEOAnalysisData, CompetitorAnalysisData } from '../types/api';
import CommentAnalysisResultComponent from '../components/CommentAnalysisResult';
import SEOAnalysisResultComponent from '../components/SEOAnalysisResult';
import CompetitorAnalysisResultComponent from '../components/CompetitorAnalysisResult';
import { SEOAPI, CompetitorAPI } from '../services/api';

const { Title, Text } = Typography;
const { Search } = Input;

const Dashboard: React.FC = () => {
  const [channelUrl, setChannelUrl] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analysisSettings, setAnalysisSettings] = useState({
    download_limit: undefined as number | undefined,
    similarity_threshold: 0.8,
    min_duplicate_count: 3,
  });
  
  const { getChannelInfo, isLoading: channelLoading, data: channelData, error: channelError } = useChannelInfo();
  const { videos, isLoading: videosLoading, error: videosError, totalResults } = useChannelVideos(selectedChannelId);
  const { appState, updateChannelInfo, updateChannelVideos, setActiveTab: setAppActiveTab } = useAppState();
  const { analyzeVideo, isLoading: analysisLoading, data: analysisData, error: analysisError } = useCommentAnalysis();
  
  // SEO 분석 상태
  const [seoAnalysisData, setSeoAnalysisData] = useState<SEOAnalysisData | null>(null);
  const [seoAnalysisLoading, setSeoAnalysisLoading] = useState(false);
  const [seoAnalysisError, setSeoAnalysisError] = useState<string | null>(null);

  // 경쟁사 분석 상태
  const [competitorAnalysisData, setCompetitorAnalysisData] = useState<CompetitorAnalysisData | null>(null);
  const [competitorAnalysisLoading, setCompetitorAnalysisLoading] = useState(false);
  const [competitorAnalysisError, setCompetitorAnalysisError] = useState<string | null>(null);
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
      await getChannelInfo({ url: channelUrl.trim() });
    } catch (error) {
      console.error('Channel analysis error:', error);
    }
  }, [channelUrl, getChannelInfo]);

  // 채널 데이터 업데이트 시 처리
  useEffect(() => {
    if (channelData) {
      updateChannelInfo(channelData);
      setSelectedChannelId(channelData.channel_id);
      setActiveTab('videos');
      setAppActiveTab('videos');
      
      notification.success({
        message: '채널 분석 완료',
        description: `${channelData.title} 채널 정보를 성공적으로 가져왔습니다.`,
      });
    }
  }, [channelData, updateChannelInfo, setAppActiveTab]);

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

  // 분석 결과 처리
  useEffect(() => {
    if (analysisData) {
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

  // 완전 초기화 함수
  const resetToInitialState = () => {
    setChannelUrl('');
    setSelectedChannelId(null);
    setSeoAnalysisData(null);
    setCompetitorAnalysisData(null);
    setCompetitorUrls(['']);
    setActiveTab('dashboard');
    setAppActiveTab('dashboard');
    // 채널 데이터도 초기화 (타입 호환성을 위해 undefined 사용)
    updateChannelInfo(undefined as any);
    updateChannelVideos(undefined as any);
  };

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
    setCompetitorAnalysisError(null);
    
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
      setCompetitorAnalysisError(errorMessage);
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

  // 비디오 목록 테이블 컬럼
  const videoColumns = [
    {
      title: '썸네일',
      dataIndex: 'thumbnails',
      key: 'thumbnail',
      width: 120,
      render: (thumbnails: VideoInfo['thumbnails']) => (
        <Avatar 
          src={thumbnails?.medium?.url || thumbnails?.default?.url} 
          size={60} 
          shape="square"
          icon={<PlayCircleOutlined />}
        />
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: VideoInfo) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.published_at).toLocaleDateString('ko-KR')}
          </Text>
        </div>
      ),
    },
    {
      title: '통계',
      key: 'statistics',
      width: 150,
      render: (record: VideoInfo) => (
        <div>
          {record.statistics && (
            <>
              <div style={{ fontSize: '12px' }}>
                <EyeOutlined /> {record.statistics.view_count?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '12px' }}>
                <CommentOutlined /> {record.statistics.comment_count?.toLocaleString() || 0}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (record: VideoInfo) => (
        <Button
          type="primary"
          size="small"
          onClick={() => handleVideoAnalysis(record.video_url)}
        >
          댓글 분석
        </Button>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'dashboard',
      label: (
        <span>
          <BarChartOutlined />
          대시보드
        </span>
      ),
      children: (
        <div style={{ 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '0'
        }}>
          {/* Hero Section */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
            padding: '80px 24px',
            textAlign: 'center',
            color: 'white'
          }}>
            <Title level={1} style={{ 
              color: 'white', 
              marginBottom: 16,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              textShadow: '0 4px 20px rgba(0,0,0,0.3)'
            }}>
              🎯 YouTube Creator Tools
            </Title>
            <Text style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              display: 'block',
              marginBottom: 48,
              maxWidth: '600px',
              margin: '0 auto 48px auto'
            }}>
              AI 기반 채널 분석으로 크리에이터의 성공을 돕는 올인원 도구
            </Text>
            
            {/* Search Box */}
            <div style={{ 
              maxWidth: '800px', 
              margin: '0 auto',
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)',
              borderRadius: '16px',
              padding: '32px',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Space.Compact style={{ width: '100%' }} size="large">
                <Search
                  placeholder="YouTube 채널 URL을 입력하세요 (예: https://www.youtube.com/@username)"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  size="large"
                  style={{ 
                    flex: 1,
                    borderRadius: '12px 0 0 12px'
                  }}
                  onPressEnter={handleChannelAnalysis}
                />
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />}
                  size="large"
                  loading={channelLoading}
                  onClick={handleChannelAnalysis}
                  style={{
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    border: 'none',
                    borderRadius: '0 12px 12px 0',
                    height: '40px',
                    minWidth: '120px',
                    fontWeight: 600,
                    boxShadow: '0 4px 15px rgba(78, 205, 196, 0.3)'
                  }}
                >
                  분석 시작
                </Button>
              </Space.Compact>
            </div>
          </div>

          {/* Main Content */}
          <div style={{ 
            padding: '40px 5%',
            width: '100%'
          }}>

          {/* 채널 정보 표시 */}
          {channelData && (
            <div style={{ marginBottom: '40px' }}>
              <Card 
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                  overflow: 'hidden'
                }}
                cover={
                  channelData.branding?.banner_image_url && (
                    <div style={{ 
                      height: '200px', 
                      overflow: 'hidden', 
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      position: 'relative'
                    }}>
                      <img
                        alt="채널 배너"
                        src={channelData.branding.banner_image_url}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.3) 100%)'
                      }} />
                    </div>
                  )
                }
              >
                {/* Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <Title level={3} style={{ 
                    margin: 0,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}>
                    채널 정보
                  </Title>
                  <Button 
                    icon={<ReloadOutlined />} 
                    onClick={resetToInitialState}
                    type="default"
                    size="middle"
                    style={{
                      borderRadius: '12px',
                      border: '1px solid #e1e5e9',
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontWeight: 500
                    }}
                  >
                    새로 시작
                  </Button>
                </div>
                {/* Channel Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '32px',
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  borderRadius: '16px',
                  border: '1px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <Avatar 
                    size={64}
                    src={channelData.thumbnails?.medium?.url || channelData.thumbnails?.default?.url}
                    icon={<UserOutlined />}
                    style={{
                      border: '3px solid white',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <Title level={2} style={{ 
                      margin: '0 0 8px 0',
                      fontSize: '1.75rem',
                      fontWeight: 700
                    }}>
                      {channelData.title}
                    </Title>
                    <Space wrap>
                      <Button
                        type="primary"
                        size="middle"
                        onClick={handleSEOAnalysis}
                        loading={seoAnalysisLoading}
                        style={{
                          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)'
                        }}
                      >
                        🔍 SEO 분석
                      </Button>
                      <Button
                        type="primary"
                        size="middle"
                        onClick={handleCompetitorAnalysis}
                        loading={competitorAnalysisLoading}
                        style={{
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          border: 'none',
                          borderRadius: '8px',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        🏆 경쟁사 분석
                      </Button>
                    </Space>
                  </div>
                </div>

                {/* Stats Grid */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={12} sm={6} lg={3}>
                    <div style={{
                      background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        {(channelData.statistics.subscriber_count / 1000).toFixed(1)}K
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>구독자</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6} lg={3}>
                    <div style={{
                      background: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👁️</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        {(channelData.statistics.view_count / 1000000).toFixed(1)}M
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 조회수</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6} lg={3}>
                    <div style={{
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎬</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        {channelData.statistics.video_count.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>비디오</div>
                    </div>
                  </Col>
                  <Col xs={12} sm={6} lg={3}>
                    <div style={{
                      background: 'linear-gradient(135deg, #FFA726, #FF7043)',
                      borderRadius: '16px',
                      padding: '20px',
                      textAlign: 'center',
                      color: 'white',
                      boxShadow: '0 8px 24px rgba(255, 167, 38, 0.3)'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                        {Math.round(channelData.statistics.view_count / Math.max(channelData.statistics.video_count, 1) / 1000).toLocaleString()}K
                      </div>
                      <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>평균 조회수</div>
                    </div>
                  </Col>
                </Row>

                {/* Additional Info Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={12} lg={8}>
                    <div style={{
                      background: 'white',
                      borderRadius: '16px',
                      padding: '20px',
                      border: '1px solid #f0f0f0',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                    }}>
                      <div style={{ 
                        fontSize: '0.9rem', 
                        color: '#8c8c8c', 
                        marginBottom: '8px',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        개설일
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#262626' }}>
                        {new Date(channelData.published_at).toLocaleDateString('ko-KR')}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#8c8c8c', marginTop: '4px' }}>
                        {Math.floor((Date.now() - new Date(channelData.published_at).getTime()) / (1000 * 60 * 60 * 24 * 365))}년 활동
                      </div>
                    </div>
                  </Col>
                  
                  {channelData.custom_url && (
                    <Col xs={24} sm={12} lg={8}>
                      <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#8c8c8c', 
                          marginBottom: '8px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          커스텀 URL
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1890ff' }}>
                          {channelData.custom_url}
                        </div>
                      </div>
                    </Col>
                  )}
                  
                  {channelData.country && (
                    <Col xs={24} sm={12} lg={8}>
                      <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '20px',
                        border: '1px solid #f0f0f0',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                      }}>
                        <div style={{ 
                          fontSize: '0.9rem', 
                          color: '#8c8c8c', 
                          marginBottom: '8px',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          국가
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#262626' }}>
                          🌍 {channelData.country}
                          {channelData.default_language && (
                            <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#8c8c8c' }}>
                              ({channelData.default_language})
                            </span>
                          )}
                        </div>
                      </div>
                    </Col>
                  )}
                </Row>

                {/* Keywords */}
                {channelData.branding?.keywords && (
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    marginBottom: '24px'
                  }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#8c8c8c', 
                      marginBottom: '16px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      채널 키워드
                    </div>
                    <div>
                      {channelData.branding.keywords.split(',').slice(0, 8).map((keyword: string, index: number) => (
                        <Tag 
                          key={index} 
                          style={{ 
                            marginBottom: '8px',
                            marginRight: '8px',
                            borderRadius: '20px',
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 12px'
                          }}
                        >
                          {keyword.trim()}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
                }}>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#8c8c8c', 
                    marginBottom: '16px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    채널 설명
                  </div>
                  <Text style={{ 
                    fontSize: '1rem', 
                    lineHeight: '1.6',
                    color: '#262626'
                  }}>
                    {channelData.description || '채널 설명이 없습니다.'}
                  </Text>
                </div>
                </Card>
            </div>
          )}

          {/* Quick Stats */}
          <Row gutter={[24, 24]} style={{ marginTop: '40px' }}>
            <Col xs={24} sm={12} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '12px',
                  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📊
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  {channelData ? 1 : 0}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '0.9rem', fontWeight: 500 }}>
                  분석된 채널
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '12px',
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  🎬
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  {videos.length}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '0.9rem', fontWeight: 500 }}>
                  로드된 비디오
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '12px',
                  background: 'linear-gradient(45deg, #FFA726, #FF7043)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  📹
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  {totalResults.toLocaleString()}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '0.9rem', fontWeight: 500 }}>
                  전체 비디오
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
              }}>
                <div style={{ 
                  fontSize: '2.5rem', 
                  marginBottom: '12px',
                  background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ✅
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '4px' }}>
                  {(seoAnalysisData ? 1 : 0) + (competitorAnalysisData ? 1 : 0)}
                </div>
                <div style={{ color: '#8c8c8c', fontSize: '0.9rem', fontWeight: 500 }}>
                  분석 완료
                </div>
              </div>
            </Col>
          </Row>

          {/* Getting Started Guide */}
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            marginTop: '40px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <Title level={3} style={{ 
              textAlign: 'center',
              marginBottom: '24px',
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }}>
              🚀 시작하기 가이드
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    1️⃣
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>URL 입력</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    YouTube 채널 URL을 상단 입력창에 입력하세요
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    2️⃣
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>채널 분석</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    '분석 시작' 버튼을 클릭하여 채널 정보를 가져오세요
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #FFA726, #FF7043)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    3️⃣
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>SEO 분석</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    채널의 SEO 최적화 상태를 분석하고 개선점을 확인하세요
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #4ECDC4, #44A08D)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    4️⃣
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>경쟁사 비교</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    경쟁 채널들과 성과를 비교하고 전략을 수립하세요
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
          </div>
        </div>
      ),
    },
    {
      key: 'videos',
      label: (
        <span>
          <PlayCircleOutlined />
          비디오 목록
        </span>
      ),
      children: (
        <div>
          {!selectedChannelId ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Text type="secondary">
                먼저 채널을 분석해주세요
              </Text>
            </div>
          ) : (
            <Spin spinning={videosLoading}>
              <Card title={`비디오 목록 (총 ${totalResults}개)`}>
                <Table
                  dataSource={videos}
                  columns={videoColumns}
                  rowKey="video_id"
                  pagination={{
                    total: totalResults,
                    pageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} 비디오`,
                  }}
                  scroll={{ x: 800 }}
                />
              </Card>
            </Spin>
          )}
        </div>
      ),
    },
    {
      key: 'analysis',
      label: (
        <span>
          <BarChartOutlined />
          댓글 분석
        </span>
      ),
      children: (
        <div>
          {analysisLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">댓글을 분석중입니다...</Text>
              </div>
            </div>
          ) : analysisData ? (
            <CommentAnalysisResultComponent
              data={analysisData}
              onDeleteComments={handleDeleteComments}
              loading={false}
            />
          ) : (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Card title="🎥 비디오 URL로 직접 분석">
                    <Space.Compact style={{ width: '100%' }} size="large">
                      <Search
                        placeholder="YouTube 비디오 URL을 입력하세요 (예: https://www.youtube.com/watch?v=VIDEO_ID)"
                        size="large"
                        style={{ flex: 1 }}
                        onSearch={(value) => {
                          if (value.trim()) {
                            handleVideoAnalysis(value.trim());
                          } else {
                            notification.error({
                              message: '입력 오류',
                              description: '비디오 URL을 입력해주세요.',
                            });
                          }
                        }}
                        enterButton={
                          <Button 
                            type="primary" 
                            icon={<BarChartOutlined />}
                            loading={analysisLoading}
                          >
                            댓글 분석
                          </Button>
                        }
                      />
                    </Space.Compact>
                    <div style={{ marginTop: 16 }}>
                      <Collapse 
                        size="small"
                        items={[
                          {
                            key: 'settings',
                            label: (
                              <Space>
                                <SettingOutlined />
                                <Text>분석 설정</Text>
                              </Space>
                            ),
                            children: (
                              <Row gutter={[16, 16]}>
                                <Col span={8}>
                                  <div>
                                    <Text strong>댓글 다운로드 수:</Text>
                                    <br />
                                    <InputNumber
                                      placeholder="전체 (비워두면 전체)"
                                      value={analysisSettings.download_limit}
                                      onChange={(value) => setAnalysisSettings(prev => ({
                                        ...prev,
                                        download_limit: value || undefined
                                      }))}
                                      min={1}
                                      max={10000}
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </Col>
                                <Col span={8}>
                                  <div>
                                    <Text strong>
                                      <Tooltip title="0.0~1.0 사이의 값. 높을수록 더 유사한 댓글만 탐지">
                                        유사도 임계값:
                                      </Tooltip>
                                    </Text>
                                    <br />
                                    <InputNumber
                                      value={analysisSettings.similarity_threshold}
                                      onChange={(value) => setAnalysisSettings(prev => ({
                                        ...prev,
                                        similarity_threshold: value || 0.8
                                      }))}
                                      min={0.1}
                                      max={1.0}
                                      step={0.1}
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </Col>
                                <Col span={8}>
                                  <div>
                                    <Text strong>
                                      <Tooltip title="이 개수 이상 반복되는 댓글을 중복으로 간주">
                                        최소 중복 개수:
                                      </Tooltip>
                                    </Text>
                                    <br />
                                    <InputNumber
                                      value={analysisSettings.min_duplicate_count}
                                      onChange={(value) => setAnalysisSettings(prev => ({
                                        ...prev,
                                        min_duplicate_count: value || 3
                                      }))}
                                      min={2}
                                      max={50}
                                      style={{ width: '100%' }}
                                    />
                                  </div>
                                </Col>
                              </Row>
                            )
                          }
                        ]}
                      />
                      
                      <Alert
                        message="사용 방법"
                        description={
                          <div>
                            <p>• YouTube 비디오 URL을 직접 입력하여 댓글을 분석할 수 있습니다</p>
                            <p>• 또는 비디오 목록 탭에서 채널의 비디오를 선택할 수 있습니다</p>
                            <p>• 댓글 수가 많으면 분석에 시간이 더 소요될 수 있습니다</p>
                            <p>• 설정을 조정하여 분석 민감도를 변경할 수 있습니다</p>
                          </div>
                        }
                        type="info"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    </div>
                  </Card>
                </Col>
              </Row>
              
              {videos.length > 0 && (
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Card title="📹 채널 비디오에서 선택">
                      <Text type="secondary">
                        채널 분석이 완료된 경우, 아래 비디오들 중에서 선택할 수 있습니다:
                      </Text>
                      <div style={{ marginTop: 16 }}>
                        {videos.slice(0, 5).map((video) => (
                          <div key={video.video_id} style={{ 
                            padding: '12px', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: '6px', 
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div style={{ flex: 1 }}>
                              <Text strong>{video.title}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(video.published_at).toLocaleDateString('ko-KR')}
                              </Text>
                            </div>
                            <Button
                              type="primary"
                              size="small"
                              onClick={() => handleVideoAnalysis(video.video_url)}
                            >
                              분석
                            </Button>
                          </div>
                        ))}
                        {videos.length > 5 && (
                          <Text type="secondary">
                            더 많은 비디오는 '비디오 목록' 탭에서 확인하세요.
                          </Text>
                        )}
                      </div>
                    </Card>
                  </Col>
                </Row>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'seo',
      label: (
        <span>
          <TrophyOutlined />
          SEO 분석
        </span>
      ),
      children: (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '0'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.9) 0%, rgba(118, 75, 162, 0.9) 100%)',
            padding: '60px 5%',
            color: 'white'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={goBackToDashboard}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                대시보드로 돌아가기
              </Button>
            </div>
            <Title level={1} style={{ 
              color: 'white', 
              marginBottom: 16,
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 700
            }}>
              🔍 SEO 분석
            </Title>
            <Text style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: 'clamp(1rem, 2vw, 1.2rem)'
            }}>
              채널의 SEO 최적화 상태를 분석하고 개선점을 제안합니다
            </Text>
          </div>

          <div style={{ padding: '40px 5%' }}>
            {seoAnalysisLoading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '100px 0',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '20px',
                backdropFilter: 'blur(20px)'
              }}>
                <Spin size="large" />
                <div style={{ marginTop: 24 }}>
                  <Title level={4}>SEO 분석 진행 중...</Title>
                  <Text type="secondary">채널의 모든 비디오를 분석하고 있습니다. 잠시만 기다려주세요.</Text>
                </div>
              </div>
            ) : seoAnalysisData ? (
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '20px',
                padding: '32px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <SEOAnalysisResultComponent data={seoAnalysisData} />
              </div>
            ) : (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                borderRadius: '20px',
                padding: '40px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <Title level={2} style={{
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '16px'
                  }}>
                    채널 SEO 분석
                  </Title>
                </div>
                
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Alert
                      message="SEO 분석이란?"
                      description={
                        <div>
                          <p>• 채널의 상위 조회수 비디오와 하위 조회수 비디오를 비교 분석합니다</p>
                          <p>• 제목, 설명, 업로드 시간 등의 SEO 요소를 분석하여 개선점을 제안합니다</p>
                          <p>• 분석에는 채널의 모든 비디오 정보가 필요하므로 시간이 오래 걸릴 수 있습니다</p>
                          <p>• 최소 10개 이상의 비디오가 있는 채널에서만 분석이 가능합니다</p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 24 }}
                    />
                    
                    {!selectedChannelId ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text type="secondary">
                          먼저 대시보드에서 채널을 분석해주세요
                        </Text>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center' }}>
                        <Button
                          type="primary"
                          size="large"
                          icon={<TrophyOutlined />}
                          onClick={handleSEOAnalysis}
                          loading={seoAnalysisLoading}
                          style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                          }}
                        >
                          SEO 분석 시작
                        </Button>
                      </div>
                    )}
                  </Col>
                </Row>
              
                {videos.length > 0 && (
                  <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                    <Col span={24}>
                      <Card 
                        title="📊 분석 대상 정보"
                        style={{
                          background: 'rgba(255,255,255,0.9)',
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
                        }}
                      >
                        <Text>현재 로드된 비디오: <Text strong>{videos.length}개</Text></Text>
                        <br />
                        <Text>전체 채널 비디오: <Text strong>{totalResults}개</Text></Text>
                        <br />
                        <Text type="secondary">
                          SEO 분석은 채널의 모든 비디오를 대상으로 수행됩니다.
                        </Text>
                      </Card>
                    </Col>
                  </Row>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'competitor',
      label: (
        <span>
          <TrophyOutlined />
          경쟁사 분석
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={goBackToDashboard}
              type="default"
            >
              대시보드로 돌아가기
            </Button>
          </div>
          {competitorAnalysisLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">경쟁사를 분석중입니다... (시간이 오래 걸릴 수 있습니다)</Text>
              </div>
            </div>
          ) : competitorAnalysisData ? (
            <CompetitorAnalysisResultComponent data={competitorAnalysisData} />
          ) : (
            <div>
              <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col span={24}>
                  <Card title="🏆 경쟁사 분석">
                    <Alert
                      message="경쟁사 분석이란?"
                      description={
                        <div>
                          <p>• 채널과 유사한 주제의 경쟁 채널들을 자동으로 찾아 비교 분석합니다</p>
                          <p>• 성과 비교 (구독자, 조회수, 비디오 수)를 통해 시장 위치를 파악합니다</p>
                          <p>• 경쟁사의 콘텐츠 전략 (제목 패턴, 업로드 패턴)을 분석합니다</p>
                          <p>• 채널 개선을 위한 전략적 제안을 제공합니다</p>
                        </div>
                      }
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                    
                    {!selectedChannelId ? (
                      <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text type="secondary">
                          먼저 대시보드에서 채널을 분석해주세요
                        </Text>
                      </div>
                    ) : (
                      <div>
                        <Form layout="vertical">
                          <Form.Item label="경쟁사 채널 URL">
                            {competitorUrls.map((url, index) => (
                              <div key={index} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                                <Input
                                  placeholder="https://www.youtube.com/@channelname 또는 https://www.youtube.com/channel/UCxxxxxx"
                                  value={url}
                                  onChange={(e) => updateCompetitorUrl(index, e.target.value)}
                                  style={{ flex: 1, marginRight: 8 }}
                                />
                                {competitorUrls.length > 1 && (
                                  <Button
                                    type="text"
                                    icon={<MinusCircleOutlined />}
                                    onClick={() => removeCompetitorUrl(index)}
                                    danger
                                  />
                                )}
                              </div>
                            ))}
                            <Button
                              type="dashed"
                              onClick={addCompetitorUrl}
                              icon={<PlusOutlined />}
                              style={{ width: '100%', marginTop: 8 }}
                            >
                              경쟁사 추가
                            </Button>
                          </Form.Item>
                        </Form>
                        
                        <div style={{ textAlign: 'center', marginTop: 16 }}>
                          <Button
                            type="primary"
                            size="large"
                            icon={<TrophyOutlined />}
                            onClick={handleCompetitorAnalysis}
                            loading={competitorAnalysisLoading}
                          >
                            경쟁사 분석 시작
                          </Button>
                          <div style={{ marginTop: 16 }}>
                            <Text type="secondary">
                              분석 기간: 30일 | 입력된 경쟁사: {competitorUrls.filter(url => url.trim() !== '').length}개
                            </Text>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </Col>
              </Row>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default Dashboard;