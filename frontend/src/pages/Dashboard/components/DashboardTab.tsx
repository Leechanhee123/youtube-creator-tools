import React from 'react';
import { 
  Card, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Avatar,
  Tag,
  Input,
  Statistic,
  Alert,
  Progress,
  Divider,
  Image,
  Tooltip,
  Select
} from 'antd';
import { 
  SearchOutlined, 
  UserOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  TrophyOutlined,
  FireOutlined,
  ClockCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import type { ChannelInfo } from '../../../types/api';
import { PerformanceAPI } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;

interface DashboardTabProps {
  channelUrl: string;
  setChannelUrl: (url: string) => void;
  channelData: ChannelInfo | null;
  channelLoading: boolean;
  videos: any[];
  totalResults: number;
  seoAnalysisData: any;
  competitorAnalysisData: any;
  onChannelAnalysis: () => void;
  onSEOAnalysis: () => void;
  onCompetitorAnalysis: () => void;
  onReset: () => void;
  seoAnalysisLoading: boolean;
  competitorAnalysisLoading: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  channelUrl,
  setChannelUrl,
  channelData,
  channelLoading,
  videos,
  totalResults,
  seoAnalysisData,
  competitorAnalysisData,
  onChannelAnalysis,
  onSEOAnalysis,
  onCompetitorAnalysis,
  onReset,
  seoAnalysisLoading,
  competitorAnalysisLoading
}) => {
  const { isAuthenticated, user, channels } = useAuth();
  const [performanceData, setPerformanceData] = React.useState<any>(null);
  const [performanceLoading, setPerformanceLoading] = React.useState(false);
  const [analysisValue, setAnalysisValue] = React.useState<number>(10);

  // 성과 분석 함수
  const handlePerformanceAnalysis = async () => {
    if (!channelData?.channel_id) return;

    setPerformanceLoading(true);
    try {
      const result = await PerformanceAPI.getComprehensiveAnalysis({
        channel_id: channelData.channel_id,
        analysis_type: 'count',
        analysis_value: analysisValue
      });
      
      if (result.success) {
        console.log('Performance analysis result:', result.data?.performance_analysis);
        setPerformanceData(result.data?.performance_analysis);
      } else {
        console.error('Performance analysis failed:', result.message);
      }
    } catch (error) {
      console.error('Performance analysis error:', error);
    } finally {
      setPerformanceLoading(false);
    }
  };

  // 채널 데이터나 분석 옵션이 변경될 때마다 성과 분석 실행
  React.useEffect(() => {
    if (channelData?.channel_id) {
      handlePerformanceAnalysis();
    }
  }, [channelData?.channel_id, analysisValue]);

  // 디버깅용 - performanceData 상태 확인
  React.useEffect(() => {
    console.log('Current performanceData:', performanceData);
  }, [performanceData]);

  return (
    <div className="full-width-container" style={{ 
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
        
        {/* Search Box - 로그인되지 않은 사용자만 표시 */}
        {!isAuthenticated && (
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
                onPressEnter={onChannelAnalysis}
              />
              <Button 
                type="primary" 
                icon={<SearchOutlined />}
                size="large"
                loading={channelLoading}
                onClick={onChannelAnalysis}
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
        )}
        
        {/* 로그인된 사용자를 위한 환영 메시지 */}
        {isAuthenticated && user && (
          <div style={{ 
            maxWidth: '800px', 
            margin: '0 auto',
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                <Avatar 
                  size={64} 
                  src={user.picture} 
                  style={{ 
                    border: '3px solid white',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
                  }}
                />
                <div>
                  <Title level={2} style={{ 
                    color: 'white', 
                    margin: 0,
                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}>
                    환영합니다, {user.name}님!
                  </Title>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: '1.1rem',
                    textShadow: '0 1px 4px rgba(0,0,0,0.3)'
                  }}>
                    {channels && channels.length > 0 
                      ? `${channels.length}개의 채널이 자동으로 분석되었습니다.`
                      : '채널 분석 준비 중입니다...'
                    }
                  </Text>
                </div>
              </div>
              
              {channels && channels.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    fontSize: '0.95rem',
                    display: 'block',
                    marginBottom: '8px'
                  }}>
                    현재 분석 중인 채널:
                  </Text>
                  <Tag 
                    color="blue" 
                    style={{ 
                      fontSize: '1rem',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      color: 'white'
                    }}
                  >
                    {channels[0].title}
                  </Tag>
                </div>
              )}
            </Space>
          </div>
        )}
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
                (channelData as any).branding?.banner_image_url && (
                  <div style={{ 
                    height: '200px', 
                    overflow: 'hidden', 
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    position: 'relative'
                  }}>
                    <img
                      alt="채널 배너"
                      src={(channelData as any).branding.banner_image_url}
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
                  onClick={onReset}
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

              {/* Enhanced Channel Header */}
              <Card className="modern-card" style={{
                marginBottom: '32px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.95))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '24px',
                  marginBottom: '24px'
                }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar 
                      size={120}
                      src={channelData.thumbnails?.high?.url || channelData.thumbnails?.medium?.url || channelData.thumbnails?.default?.url}
                      icon={<UserOutlined />}
                      className="hover-lift"
                      style={{
                        border: '4px solid white',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
                      }}
                    />
                    {channelData.custom_url && (
                      <div style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '-5px',
                        background: '#1890ff',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)'
                      }}>
                        <span style={{ color: 'white', fontSize: '16px' }}>✓</span>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: '16px' }}>
                      <Title level={1} style={{ 
                        margin: '0 0 8px 0',
                        fontSize: '2.2rem',
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {channelData.title}
                      </Title>
                      
                      {channelData.custom_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
                            youtube.com/{channelData.custom_url}
                          </Text>
                          <Tag color="blue" style={{ borderRadius: '12px', fontWeight: 600 }}>
                            인증된 채널
                          </Tag>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        <div style={{ 
                          background: 'linear-gradient(135deg, #f6f9fc, #eef2f7)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: '1px solid #e8f4fd'
                        }}>
                          <CalendarOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                          <Text style={{ fontSize: '0.9rem', color: '#595959', fontWeight: 500 }}>
                            {new Date(channelData.published_at).toLocaleDateString('ko-KR')} 개설
                          </Text>
                        </div>
                        <div style={{ 
                          background: 'linear-gradient(135deg, #fff7e6, #fff1b8)',
                          padding: '8px 16px',
                          borderRadius: '20px',
                          border: '1px solid #ffe58f'
                        }}>
                          <TrophyOutlined style={{ marginRight: '6px', color: '#fa8c16' }} />
                          <Text style={{ fontSize: '0.9rem', color: '#fa8c16', fontWeight: 600 }}>
                            {Math.floor((Date.now() - new Date(channelData.published_at).getTime()) / (1000 * 60 * 60 * 24 * 365))}년차 크리에이터
                          </Text>
                        </div>
                      </div>
                    </div>
                    
                    {channelData.description && (
                      <div style={{ 
                        marginBottom: '20px',
                        padding: '16px',
                        background: 'rgba(0,0,0,0.02)',
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        <Text style={{ 
                          fontSize: '1rem', 
                          lineHeight: '1.6',
                          color: '#595959',
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {channelData.description}
                        </Text>
                      </div>
                    )}
                    
                    <Space wrap size="middle">
                      <Button
                        type="primary"
                        size="large"
                        onClick={onSEOAnalysis}
                        loading={seoAnalysisLoading}
                        className="modern-button hover-lift"
                        style={{
                          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          height: '48px',
                          padding: '0 24px',
                          fontSize: '1rem',
                          boxShadow: '0 6px 20px rgba(78, 205, 196, 0.3)'
                        }}
                      >
                        🔍 SEO 분석
                      </Button>
                      <Button
                        type="primary"
                        size="large"
                        onClick={onCompetitorAnalysis}
                        loading={competitorAnalysisLoading}
                        className="modern-button hover-lift"
                        style={{
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          border: 'none',
                          borderRadius: '12px',
                          fontWeight: 600,
                          height: '48px',
                          padding: '0 24px',
                          fontSize: '1rem',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)'
                        }}
                      >
                        🏆 경쟁사 분석
                      </Button>
                    </Space>
                  </div>
                </div>
              </Card>

              {/* Performance Analysis Options */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid #f0f0f0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                marginBottom: '24px'
              }}>
                <div style={{ 
                  fontSize: '1rem', 
                  color: '#262626',
                  marginBottom: '16px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  ⚙️ 성과 분석 설정
                </div>
                
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ marginBottom: '8px', fontWeight: 500 }}>분석할 비디오 개수</div>
                    <Select
                      value={analysisValue}
                      onChange={setAnalysisValue}
                      style={{ width: '100%' }}
                      size="middle"
                    >
                      <Select.Option value={5}>최신 5개</Select.Option>
                      <Select.Option value={10}>최신 10개</Select.Option>
                      <Select.Option value={20}>최신 20개</Select.Option>
                      <Select.Option value={30}>최신 30개</Select.Option>
                      <Select.Option value={50}>최신 50개</Select.Option>
                    </Select>
                  </Col>
                  
                  <Col xs={24} sm={12} md={6}>
                    <div style={{ marginBottom: '8px', fontWeight: 500, opacity: 0.7 }}>
                      분석 기준
                    </div>
                    <div style={{ 
                      padding: '8px 12px',
                      background: '#f0f2f5',
                      border: '1px solid #d9d9d9',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: '#595959'
                    }}>
                      최신 비디오 개수 기준
                    </div>
                  </Col>
                  
                  <Col xs={24} sm={24} md={12}>
                    <div style={{ marginBottom: '8px', fontWeight: 500, opacity: 0.7 }}>
                      분석 상태
                    </div>
                    <div style={{ 
                      padding: '8px 12px',
                      background: performanceLoading ? '#e6f7ff' : '#f6ffed',
                      border: `1px solid ${performanceLoading ? '#91d5ff' : '#b7eb8f'}`,
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: performanceLoading ? '#096dd9' : '#52c41a'
                    }}>
                      {performanceLoading ? '분석 중...' : 
                       performanceData ? `${performanceData.videos_analyzed}개 비디오 분석 완료` : '대기 중'}
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Main Stats Grid */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={12} sm={6} lg={3}>
                  <div className="stat-card" style={{
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <UserOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                      {channelData.statistics.subscriber_count >= 1000000 
                        ? `${(channelData.statistics.subscriber_count / 1000000).toFixed(1)}M`
                        : `${(channelData.statistics.subscriber_count / 1000).toFixed(1)}K`
                      }
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>구독자</div>
                    <div style={{ 
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      fontSize: '0.7rem',
                      opacity: 0.7
                    }}>
                      {channelData.statistics.subscriber_count.toLocaleString()}
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} sm={6} lg={3}>
                  <div className="stat-card" style={{
                    background: 'linear-gradient(135deg, #4ECDC4, #44A08D)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(78, 205, 196, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <EyeOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                      {channelData.statistics.view_count >= 1000000000
                        ? `${(channelData.statistics.view_count / 1000000000).toFixed(1)}B`
                        : `${(channelData.statistics.view_count / 1000000).toFixed(1)}M`
                      }
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>총 조회수</div>
                    <div style={{ 
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      fontSize: '0.7rem',
                      opacity: 0.7
                    }}>
                      {channelData.statistics.view_count.toLocaleString()}
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} sm={6} lg={3}>
                  <div className="stat-card" style={{
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <PlayCircleOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                      {channelData.statistics.video_count.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>비디오</div>
                    <div style={{ 
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      fontSize: '0.7rem',
                      opacity: 0.7
                    }}>
                      총 {channelData.statistics.video_count}개
                    </div>
                  </div>
                </Col>
                
                <Col xs={12} sm={6} lg={3}>
                  <div className="stat-card" style={{
                    background: 'linear-gradient(135deg, #FFA726, #FF7043)',
                    borderRadius: '16px',
                    padding: '20px',
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 8px 24px rgba(255, 167, 38, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <TrophyOutlined style={{ fontSize: '2rem', marginBottom: '8px' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
                      {Math.round(channelData.statistics.view_count / Math.max(channelData.statistics.video_count, 1) / 1000).toLocaleString()}K
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>평균 조회수</div>
                    <div style={{ 
                      position: 'absolute',
                      bottom: '8px',
                      right: '8px',
                      fontSize: '0.7rem',
                      opacity: 0.7
                    }}>
                      /비디오
                    </div>
                  </div>
                </Col>
              </Row>


              {/* Secondary Stats Grid */}
              <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={6}>
                  <Card className="modern-card hover-lift" style={{ textAlign: 'center', height: '140px' }}>
                    <div style={{ color: '#1890ff', fontSize: '2rem', marginBottom: '8px' }}>
                      <FireOutlined />
                    </div>
                    <Statistic 
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {performanceData?.metrics?.recent_performance?.label || "최근 성과"}
                          <Tooltip
                            title={
                              <div>
                                <div><strong>최근 성과 계산식:</strong></div>
                                <div>• 평균 조회수 = 분석된 비디오들의 조회수 평균</div>
                                <div>• 구독자당 조회율 = (평균 조회수 ÷ 구독자 수) × 100</div>
                                <div>• 점수 = (구독자당 조회율 ÷ 20) × 100</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  20% 조회율을 100점 기준으로 계산
                                </div>
                                {performanceData && (
                                  <div style={{ marginTop: '8px', borderTop: '1px solid #444', paddingTop: '8px' }}>
                                    <div>분석 영상: {performanceData.videos_analyzed}개</div>
                                    <div>현재 값: {performanceData.metrics?.recent_performance?.value}%</div>
                                  </div>
                                )}
                              </div>
                            }
                            placement="topLeft"
                          >
                            <QuestionCircleOutlined style={{ color: '#8c8c8c', fontSize: '0.8rem' }} />
                          </Tooltip>
                        </div>
                      } 
                      value={
                        performanceLoading ? '분석중...' :
                        performanceData?.metrics?.recent_performance?.value || 
                        (channelData.statistics.view_count / Math.max(channelData.statistics.subscriber_count, 1)).toFixed(1)
                      } 
                      suffix={performanceData?.metrics?.recent_performance ? "%" : "배"}
                      valueStyle={{ color: '#1890ff', fontSize: '1.2rem' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card className="modern-card hover-lift" style={{ textAlign: 'center', height: '140px' }}>
                    <div style={{ color: '#52c41a', fontSize: '2rem', marginBottom: '8px' }}>
                      <CalendarOutlined />
                    </div>
                    <Statistic 
                      title="활동 기간" 
                      value={Math.floor((Date.now() - new Date(channelData.published_at).getTime()) / (1000 * 60 * 60 * 24 * 365))} 
                      suffix="년"
                      valueStyle={{ color: '#52c41a', fontSize: '1.2rem' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card className="modern-card hover-lift" style={{ textAlign: 'center', height: '140px' }}>
                    <div style={{ color: '#722ed1', fontSize: '2rem', marginBottom: '8px' }}>
                      <ClockCircleOutlined />
                    </div>
                    <Statistic 
                      title="월평균 업로드" 
                      value={Math.round(channelData.statistics.video_count / Math.max(Math.floor((Date.now() - new Date(channelData.published_at).getTime()) / (1000 * 60 * 60 * 24 * 30)), 1))} 
                      suffix="개"
                      valueStyle={{ color: '#722ed1', fontSize: '1.2rem' }}
                    />
                  </Card>
                </Col>
                
                <Col xs={24} sm={12} md={6}>
                  <Card className="modern-card hover-lift" style={{ textAlign: 'center', height: '140px' }}>
                    <div style={{ color: '#fa8c16', fontSize: '2rem', marginBottom: '8px' }}>
                      📈
                    </div>
                    <Statistic 
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          종합 성과 지수
                          <Tooltip
                            title={
                              <div>
                                <div><strong>종합 성과 지수 계산식:</strong></div>
                                <div>• 최근 성과 (40% 가중치) - 구독자 대비 조회율</div>
                                <div>• 비디오 품질 (30% 가중치) - 조회수 + 참여도 종합</div>
                                <div>• 콘텐츠 일관성 (20% 가중치) - 업로드 스케줄 규칙성</div>
                                <div>• 참여도 (10% 가중치) - 좋아요/댓글 비율</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  YouTube Data API 기반 4개 메트릭의 가중평균
                                </div>
                                {performanceData && (
                                  <div style={{ marginTop: '8px', borderTop: '1px solid #444', paddingTop: '8px' }}>
                                    <div>최근 성과: {performanceData.metrics?.recent_performance?.score}점</div>
                                    <div>비디오 품질: {performanceData.metrics?.video_quality?.score}점</div>
                                    <div>콘텐츠 일관성: {performanceData.metrics?.content_consistency?.score}점</div>
                                    <div>참여도: {performanceData.metrics?.engagement_rate?.score}점</div>
                                  </div>
                                )}
                              </div>
                            }
                            placement="topLeft"
                          >
                            <QuestionCircleOutlined style={{ color: '#8c8c8c', fontSize: '0.8rem' }} />
                          </Tooltip>
                        </div>
                      } 
                      value={
                        performanceLoading ? '분석중...' :
                        performanceData?.comprehensive_score || 
                        Math.min(Math.round((channelData.statistics.view_count / 1000000 + channelData.statistics.subscriber_count / 10000) / 2), 100)
                      } 
                      suffix="/100"
                      valueStyle={{ color: '#fa8c16', fontSize: '1.2rem' }}
                    />
                  </Card>
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
                
                {(channelData as any).country && (
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
                        🌍 {(channelData as any).country}
                        {(channelData as any).default_language && (
                          <span style={{ marginLeft: '8px', fontSize: '0.9rem', color: '#8c8c8c' }}>
                            ({(channelData as any).default_language})
                          </span>
                        )}
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {/* Keywords */}
              {(channelData as any).branding?.keywords && (
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
                    {(channelData as any).branding.keywords.split(',').slice(0, 8).map((keyword: string, index: number) => (
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

              {/* Performance Analysis Details */}
              {performanceData && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    color: '#262626',
                    marginBottom: '20px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    📊 상세 성과 분석
                    <Tag color="blue" style={{ marginLeft: 'auto' }}>
                      {performanceData.analysis_period}
                    </Tag>
                  </div>
                  
                  <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} lg={6}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#8c8c8c', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}>
                          최근 성과
                          <Tooltip
                            title={
                              <div>
                                <div><strong>점수 기준:</strong></div>
                                <div>• 100점: 20% 이상 조회율 (매우 우수)</div>
                                <div>• 80점: 16% 조회율 (우수)</div>
                                <div>• 60점: 12% 조회율 (보통)</div>
                                <div>• 40점: 8% 조회율 (개선 필요)</div>
                                <div>• 20점: 4% 조회율 (부족)</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  현재: {performanceData.metrics.recent_performance.value}% 조회율
                                </div>
                              </div>
                            }
                            placement="top"
                          >
                            <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: '0.7rem' }} />
                          </Tooltip>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#1890ff' }}>
                          {performanceData.metrics.recent_performance.score}/100
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8c8c8c' }}>
                          {performanceData.metrics.recent_performance.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: performanceData.metrics.recent_performance.score >= 80 ? '#52c41a' : 
                                performanceData.metrics.recent_performance.score >= 60 ? '#faad14' : '#ff4d4f',
                          marginTop: '4px',
                          fontWeight: 500
                        }}>
                          {performanceData.metrics.recent_performance.score >= 80 ? '우수' : 
                           performanceData.metrics.recent_performance.score >= 60 ? '보통' : '개선필요'}
                        </div>
                      </div>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#8c8c8c', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}>
                          비디오 품질
                          <Tooltip
                            title={
                              <div>
                                <div><strong>비디오 품질 계산식:</strong></div>
                                <div>• 각 비디오별 점수 계산:</div>
                                <div>&nbsp;&nbsp;- 조회수 비율 = 비디오 조회수 ÷ 구독자 수</div>
                                <div>&nbsp;&nbsp;- 참여도 = (좋아요 + 댓글) ÷ 조회수</div>
                                <div>&nbsp;&nbsp;- 품질 점수 = 조회수 비율 × 100 + 참여도 × 1000</div>
                                <div>• 최종 점수 = 평균 품질 + 일관성 보너스</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  구독 전환율 대신 실제 측정 가능한 품질 지표 사용
                                </div>
                              </div>
                            }
                            placement="top"
                          >
                            <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: '0.7rem' }} />
                          </Tooltip>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#52c41a' }}>
                          {performanceData.metrics.video_quality.score}/100
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8c8c8c' }}>
                          {performanceData.metrics.video_quality.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: performanceData.metrics.video_quality.score >= 70 ? '#52c41a' : 
                                performanceData.metrics.video_quality.score >= 50 ? '#faad14' : '#ff4d4f',
                          marginTop: '4px',
                          fontWeight: 500
                        }}>
                          {performanceData.metrics.video_quality.score >= 70 ? '우수' : 
                           performanceData.metrics.video_quality.score >= 50 ? '보통' : '개선필요'}
                        </div>
                      </div>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏰</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#8c8c8c', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}>
                          콘텐츠 일관성
                          <Tooltip
                            title={
                              <div>
                                <div><strong>점수 기준:</strong></div>
                                <div>• 90점 이상: 매우 규칙적인 업로드</div>
                                <div>• 70점 이상: 규칙적인 업로드</div>
                                <div>• 50점 이상: 보통 수준의 일관성</div>
                                <div>• 30점 이상: 불규칙한 업로드</div>
                                <div>• 30점 미만: 매우 불규칙</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  업로드 간격의 편차가 작을수록 높은 점수
                                </div>
                              </div>
                            }
                            placement="top"
                          >
                            <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: '0.7rem' }} />
                          </Tooltip>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#722ed1' }}>
                          {performanceData.metrics.content_consistency.score}/100
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8c8c8c' }}>
                          {performanceData.metrics.content_consistency.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: performanceData.metrics.content_consistency.score >= 70 ? '#52c41a' : 
                                performanceData.metrics.content_consistency.score >= 50 ? '#faad14' : '#ff4d4f',
                          marginTop: '4px',
                          fontWeight: 500
                        }}>
                          {performanceData.metrics.content_consistency.score >= 70 ? '규칙적' : 
                           performanceData.metrics.content_consistency.score >= 50 ? '보통' : '불규칙'}
                        </div>
                      </div>
                    </Col>
                    
                    <Col xs={24} sm={12} lg={6}>
                      <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>❤️</div>
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#8c8c8c', 
                          marginBottom: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}>
                          참여도
                          <Tooltip
                            title={
                              <div>
                                <div><strong>점수 기준:</strong></div>
                                <div>• 100점: 5% 이상 참여도 (매우 우수)</div>
                                <div>• 80점: 4% 참여도 (우수)</div>
                                <div>• 60점: 3% 참여도 (보통)</div>
                                <div>• 40점: 2% 참여도 (개선 필요)</div>
                                <div>• 20점: 1% 참여도 (부족)</div>
                                <div style={{ marginTop: '8px', fontSize: '0.9em', opacity: 0.8 }}>
                                  참여도 = (좋아요 + 댓글) ÷ 조회수 × 100
                                </div>
                                <div style={{ fontSize: '0.9em', opacity: 0.8 }}>
                                  현재: {performanceData.metrics.engagement_rate.value}% 참여도
                                </div>
                              </div>
                            }
                            placement="top"
                          >
                            <QuestionCircleOutlined style={{ color: '#bfbfbf', fontSize: '0.7rem' }} />
                          </Tooltip>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#fa8c16' }}>
                          {performanceData.metrics.engagement_rate.score}/100
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#8c8c8c' }}>
                          {performanceData.metrics.engagement_rate.label}
                        </div>
                        <div style={{ 
                          fontSize: '0.7rem', 
                          color: performanceData.metrics.engagement_rate.score >= 60 ? '#52c41a' : 
                                performanceData.metrics.engagement_rate.score >= 40 ? '#faad14' : '#ff4d4f',
                          marginTop: '4px',
                          fontWeight: 500
                        }}>
                          {performanceData.metrics.engagement_rate.score >= 60 ? '우수' : 
                           performanceData.metrics.engagement_rate.score >= 40 ? '보통' : '개선필요'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <Divider />
                  
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#8c8c8c', marginBottom: '8px' }}>
                      분석된 영상: {performanceData.videos_analyzed}개
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#bfbfbf' }}>
                      마지막 업데이트: {new Date(performanceData.last_updated).toLocaleString('ko-KR')}
                    </div>
                  </div>
                </div>
              )}

              {/* Performance Comparison */}
              {performanceData?.performance_comparison && performanceData.performance_comparison.best_video && (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #f0f0f0',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  marginBottom: '24px'
                }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    color: '#262626',
                    marginBottom: '20px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    🏆 성과 비교 분석
                    <Tag color="gold" style={{ marginLeft: 'auto' }}>
                      성과 격차: {performanceData.performance_comparison.performance_gap}%
                    </Tag>
                  </div>
                  
                  <Row gutter={[24, 16]}>
                    {/* 최고 성과 영상 */}
                    <Col xs={24} lg={12}>
                      <div style={{ 
                        padding: '20px',
                        background: 'linear-gradient(135deg, #e6fffb 0%, #f6ffed 100%)',
                        borderRadius: '12px',
                        border: '1px solid #87e8de'
                      }}>
                        <div style={{ 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: '#00474f',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📈 최고 성과 영상
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>제목</div>
                          <div style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: 500,
                            lineHeight: '1.4',
                            maxHeight: '2.8rem',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {performanceData.performance_comparison.best_video.title}
                          </div>
                        </div>
                        
                        <Row gutter={[12, 8]}>
                          <Col span={12}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>조회수</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#00474f' }}>
                              {performanceData.performance_comparison.best_video.view_count.toLocaleString()}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>참여도</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#00474f' }}>
                              {performanceData.performance_comparison.best_video.engagement_rate}%
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                    
                    {/* 최저 성과 영상 */}
                    <Col xs={24} lg={12}>
                      <div style={{ 
                        padding: '20px',
                        background: 'linear-gradient(135deg, #fff2e8 0%, #fff7e6 100%)',
                        borderRadius: '12px',
                        border: '1px solid #ffd591'
                      }}>
                        <div style={{ 
                          fontSize: '1rem', 
                          fontWeight: 600, 
                          color: '#ad4e00',
                          marginBottom: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          📉 최저 성과 영상
                        </div>
                        
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>제목</div>
                          <div style={{ 
                            fontSize: '0.95rem', 
                            fontWeight: 500,
                            lineHeight: '1.4',
                            maxHeight: '2.8rem',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical'
                          }}>
                            {performanceData.performance_comparison.worst_video.title}
                          </div>
                        </div>
                        
                        <Row gutter={[12, 8]}>
                          <Col span={12}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>조회수</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ad4e00' }}>
                              {performanceData.performance_comparison.worst_video.view_count.toLocaleString()}
                            </div>
                          </Col>
                          <Col span={12}>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>참여도</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#ad4e00' }}>
                              {performanceData.performance_comparison.worst_video.engagement_rate}%
                            </div>
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                  
                  {/* 인사이트 */}
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#595959', marginBottom: '12px' }}>
                      💡 분석 인사이트
                    </div>
                    <div style={{ 
                      background: '#fafafa',
                      borderRadius: '8px',
                      padding: '16px'
                    }}>
                      {performanceData.performance_comparison.insights.map((insight: string, index: number) => (
                        <div key={index} style={{ 
                          fontSize: '0.85rem',
                          color: '#595959',
                          marginBottom: index < performanceData.performance_comparison.insights.length - 1 ? '8px' : '0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span style={{ color: '#1890ff' }}>•</span>
                          {insight}
                        </div>
                      ))}
                    </div>
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

        {/* Analytics 제한사항 알림 */}
        {channelData && (
          <Alert
            message="분석 데이터 안내"
            description={
              <div>
                <p style={{ marginBottom: '12px' }}>
                  <strong>YouTube Analytics API 권한이 제한되어 기본 정보만 표시됩니다.</strong>
                </p>
                <div style={{ marginBottom: '8px' }}>
                  <Text strong style={{ color: '#52c41a' }}>✅ 조회 가능한 데이터:</Text>
                  <ul style={{ marginTop: '4px', marginBottom: '8px', paddingLeft: '20px' }}>
                    <li>총 구독자 수, 총 조회수, 총 비디오 수</li>
                    <li>최근 업로드 비디오 수 및 조회수</li>
                    <li>채널 기본 정보 (제목, 설명, 썸네일 등)</li>
                  </ul>
                </div>
                <div>
                  <Text strong style={{ color: '#ff4d4f' }}>❌ 제한된 데이터:</Text>
                  <ul style={{ marginTop: '4px', paddingLeft: '20px' }}>
                    <li>수익 데이터 (광고 수익, 총 수익 등)</li>
                    <li>시청 시간 및 평균 시청 시간</li>
                    <li>구독자 증감 추이</li>
                    <li>실시간 분석 데이터</li>
                  </ul>
                </div>
                <div style={{ marginTop: '12px', padding: '8px', background: '#f6ffed', borderRadius: '6px', border: '1px solid #b7eb8f' }}>
                  <Text style={{ fontSize: '13px', color: '#389e0d' }}>
                    💡 <strong>상세 분석을 위해서는</strong> 채널 소유자로 직접 로그인하거나, 
                    YouTube Studio에서 분석 데이터를 확인하세요.
                  </Text>
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{
              marginTop: '24px',
              marginBottom: '24px',
              borderRadius: '12px',
              border: '1px solid #91caff',
              background: 'linear-gradient(135deg, rgba(24, 144, 255, 0.05), rgba(114, 46, 209, 0.05))'
            }}
          />
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

        {/* Getting Started Guide - 로그인되지 않은 사용자용 */}
        {!isAuthenticated && (
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
        )}
        
        {/* 로그인된 사용자를 위한 다음 단계 가이드 */}
        {isAuthenticated && channelData && (
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
              🎯 다음 단계 가이드
            </Title>
            
            <Row gutter={[24, 16]}>
              <Col xs={24} sm={12} lg={8}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    📊
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>채널 관리</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    채널 관리 탭에서 수익 분석과 댓글 관리를 확인하세요
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    🎬
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>비디오 분석</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    비디오 탭에서 개별 영상의 댓글을 분석하고 관리하세요
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={12} lg={8}>
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <div style={{ 
                    fontSize: '3rem', 
                    marginBottom: '16px',
                    background: 'linear-gradient(45deg, #FFA726, #FF7043)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    🔍
                  </div>
                  <Title level={5} style={{ marginBottom: '8px' }}>SEO 최적화</Title>
                  <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                    SEO 분석을 통해 채널의 검색 노출을 개선하세요
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTab;