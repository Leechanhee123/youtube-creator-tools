import React from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Alert,
  Spin
} from 'antd';
import { 
  TrophyOutlined, 
  ArrowLeftOutlined 
} from '@ant-design/icons';
import type { SEOAnalysisData } from '../../../types/api';
import SEOAnalysisResultComponent from '../../../components/SEOAnalysisResult';

const { Title, Text } = Typography;

interface SEOTabProps {
  selectedChannelId: string | null;
  seoAnalysisLoading: boolean;
  seoAnalysisData: SEOAnalysisData | null;
  videos: any[];
  totalResults: number;
  onSEOAnalysis: () => void;
  onGoBack: () => void;
}

const SEOTab: React.FC<SEOTabProps> = ({
  selectedChannelId,
  seoAnalysisLoading,
  seoAnalysisData,
  videos,
  totalResults,
  onSEOAnalysis,
  onGoBack
}) => {
  return (
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
            onClick={onGoBack}
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
                      onClick={onSEOAnalysis}
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
  );
};

export default SEOTab;