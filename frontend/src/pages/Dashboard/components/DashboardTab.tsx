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
  Input
} from 'antd';
import { 
  SearchOutlined, 
  UserOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ChannelInfo } from '../../../types/api';

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
  return (
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
                      onClick={onSEOAnalysis}
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
                      onClick={onCompetitorAnalysis}
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
  );
};

export default DashboardTab;