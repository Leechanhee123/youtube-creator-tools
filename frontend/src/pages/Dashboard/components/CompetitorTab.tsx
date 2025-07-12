import React from 'react';
import { 
  Card, 
  Button, 
  Typography, 
  Row, 
  Col, 
  Alert,
  Spin,
  Form,
  Input
} from 'antd';
import { 
  TrophyOutlined, 
  ArrowLeftOutlined,
  PlusOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';
import type { CompetitorAnalysisData } from '../../../types/api';
import CompetitorAnalysisResultComponent from '../../../components/CompetitorAnalysisResult';

const { Title, Text } = Typography;

interface CompetitorTabProps {
  selectedChannelId: string | null;
  competitorAnalysisLoading: boolean;
  competitorAnalysisData: CompetitorAnalysisData | null;
  competitorUrls: string[];
  onCompetitorAnalysis: () => void;
  onGoBack: () => void;
  addCompetitorUrl: () => void;
  removeCompetitorUrl: (index: number) => void;
  updateCompetitorUrl: (index: number, value: string) => void;
}

const CompetitorTab: React.FC<CompetitorTabProps> = ({
  selectedChannelId,
  competitorAnalysisLoading,
  competitorAnalysisData,
  competitorUrls,
  onCompetitorAnalysis,
  onGoBack,
  addCompetitorUrl,
  removeCompetitorUrl,
  updateCompetitorUrl
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
          🏆 경쟁사 분석
        </Title>
        <Text style={{ 
          color: 'rgba(255,255,255,0.9)', 
          fontSize: 'clamp(1rem, 2vw, 1.2rem)'
        }}>
          경쟁 채널들과 성과를 비교하고 전략적 인사이트를 제공합니다
        </Text>
      </div>

      <div style={{ padding: '40px 5%' }}>
        {competitorAnalysisLoading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 0',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '20px',
            backdropFilter: 'blur(20px)'
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 24 }}>
              <Title level={4}>경쟁사 분석 진행 중...</Title>
              <Text type="secondary">경쟁 채널들을 분석하고 있습니다. 시간이 오래 걸릴 수 있습니다.</Text>
            </div>
          </div>
        ) : competitorAnalysisData ? (
          <div style={{
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '20px',
            padding: '32px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <CompetitorAnalysisResultComponent data={competitorAnalysisData} />
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '20px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col span={24}>
                <Card title="🏆 경쟁사 분석">
                  <Alert
                    message="경쟁사 분석이란?"
                    description={
                      <div>
                        <p>• 입력한 경쟁 채널들과 성과를 비교 분석합니다</p>
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
                          onClick={onCompetitorAnalysis}
                          loading={competitorAnalysisLoading}
                          style={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            border: 'none',
                            borderRadius: '12px',
                            fontWeight: 600,
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                          }}
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
    </div>
  );
};

export default CompetitorTab;