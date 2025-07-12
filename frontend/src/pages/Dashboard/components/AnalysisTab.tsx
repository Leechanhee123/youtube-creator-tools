import React from 'react';
import { 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Row, 
  Col, 
  Alert,
  Collapse,
  InputNumber,
  Tooltip,
  Spin,
  notification
} from 'antd';
import { 
  BarChartOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import type { VideoInfo, CommentAnalysisResult } from '../../../types/api';
import CommentAnalysisResultComponent from '../../../components/CommentAnalysisResult';

const { Search } = Input;
const { Text } = Typography;

interface AnalysisTabProps {
  analysisLoading: boolean;
  analysisData: CommentAnalysisResult | null;
  videos: VideoInfo[];
  analysisSettings: {
    download_limit: number | undefined;
    similarity_threshold: number;
    min_duplicate_count: number;
  };
  setAnalysisSettings: React.Dispatch<React.SetStateAction<{
    download_limit: number | undefined;
    similarity_threshold: number;
    min_duplicate_count: number;
  }>>;
  onVideoAnalysis: (videoUrl: string) => void;
  onDeleteComments: (commentIds: string[]) => void;
}

const AnalysisTab: React.FC<AnalysisTabProps> = ({
  analysisLoading,
  analysisData,
  videos,
  analysisSettings,
  setAnalysisSettings,
  onVideoAnalysis,
  onDeleteComments
}) => {
  const handleDirectAnalysis = (value: string) => {
    if (value.trim()) {
      onVideoAnalysis(value.trim());
    } else {
      notification.error({
        message: '입력 오류',
        description: '비디오 URL을 입력해주세요.',
      });
    }
  };

  if (analysisLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">댓글을 분석중입니다...</Text>
        </div>
      </div>
    );
  }

  if (analysisData) {
    return (
      <CommentAnalysisResultComponent
        data={analysisData}
        onDeleteComments={onDeleteComments}
        loading={false}
      />
    );
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="🎥 비디오 URL로 직접 분석">
            <Space.Compact style={{ width: '100%' }} size="large">
              <Search
                placeholder="YouTube 비디오 URL을 입력하세요 (예: https://www.youtube.com/watch?v=VIDEO_ID)"
                size="large"
                style={{ flex: 1 }}
                onSearch={handleDirectAnalysis}
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
                      onClick={() => onVideoAnalysis(video.video_url)}
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
  );
};

export default AnalysisTab;