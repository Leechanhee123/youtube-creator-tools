import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Progress,
  Statistic,
  Typography,
  Space,
  Tag,
  Tooltip,
  Alert,
  Spin,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  GlobalOutlined,
  PlayCircleOutlined,
  BarChartOutlined,
  UserOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface TrafficSourceAnalysisProps {
  channelId: string;
  days: number;
}

interface TrafficSourceData {
  sources: Array<{
    type: string;
    total_views: number;
    total_watch_time: number;
    total_engaged_views: number;
    percentage: number;
    details: Record<string, any>;
  }>;
  total_views: number;
  top_source: string;
}

const TrafficSourceAnalysis: React.FC<TrafficSourceAnalysisProps> = ({
  channelId,
  days
}) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [trafficData, setTrafficData] = useState<TrafficSourceData | null>(null);

  const fetchTrafficSources = async () => {
    if (!channelId || !accessToken) return;

    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/analytics/traffic-sources?channel_id=${channelId}&days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setTrafficData(result.data);
        }
      }
    } catch (error) {
      console.error('Traffic sources fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrafficSources();
  }, [channelId, accessToken, days]);

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType.toUpperCase()) {
      case 'SEARCH': return <SearchOutlined style={{ color: '#52c41a' }} />;
      case 'BROWSE': return <GlobalOutlined style={{ color: '#1890ff' }} />;
      case 'RELATED_VIDEO': return <PlayCircleOutlined style={{ color: '#f5222d' }} />;
      case 'EXTERNAL': return <GlobalOutlined style={{ color: '#fa8c16' }} />;
      case 'SUBSCRIBER': return <UserOutlined style={{ color: '#722ed1' }} />;
      case 'PLAYLIST': return <BarChartOutlined style={{ color: '#eb2f96' }} />;
      default: return <BarChartOutlined style={{ color: '#666' }} />;
    }
  };

  const getSourceDescription = (sourceType: string) => {
    switch (sourceType.toUpperCase()) {
      case 'SEARCH': return 'YouTube 검색을 통한 유입';
      case 'BROWSE': return 'YouTube 홈/추천을 통한 유입';
      case 'RELATED_VIDEO': return '관련 동영상을 통한 유입';
      case 'EXTERNAL': return '외부 사이트를 통한 유입';
      case 'SUBSCRIBER': return '구독자 피드를 통한 유입';
      case 'PLAYLIST': return '재생목록을 통한 유입';
      case 'ADVERTISING': return '광고를 통한 유입';
      case 'NOTIFICATION': return '알림을 통한 유입';
      case 'DIRECT_PLAYBACK': return '직접 재생을 통한 유입';
      case 'CHANNEL': return '채널 페이지를 통한 유입';
      default: return '기타 경로를 통한 유입';
    }
  };

  if (loading) {
    return (
      <Card title="🚪 트래픽 소스 분석" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!trafficData || !trafficData.sources || !Array.isArray(trafficData.sources) || trafficData.sources.length === 0) {
    return (
      <Card title="🚪 트래픽 소스 분석">
        <Empty 
          description="트래픽 소스 데이터를 불러올 수 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const columns = [
    {
      title: '트래픽 소스',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Space>
          {getSourceIcon(type)}
          <div>
            <Text strong>{type.replace('_', ' ')}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getSourceDescription(type)}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '조회수',
      dataIndex: 'total_views',
      key: 'total_views',
      render: (views: number) => (
        <Statistic 
          value={views} 
          valueStyle={{ fontSize: '14px' }}
        />
      ),
      sorter: (a: any, b: any) => a.total_views - b.total_views,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: '비율',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <div style={{ minWidth: '120px' }}>
          <Progress 
            percent={percentage} 
            size="small" 
            format={() => `${percentage}%`}
          />
        </div>
      ),
    },
    {
      title: '시청 시간',
      dataIndex: 'total_watch_time',
      key: 'total_watch_time',
      render: (time: number) => (
        <div>
          <Text>{Math.round(time / 60)}시간</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {time.toLocaleString()}분
          </Text>
        </div>
      ),
    },
    {
      title: '참여 조회수',
      dataIndex: 'total_engaged_views',
      key: 'total_engaged_views',
      render: (engaged: number, record: any) => (
        <div>
          <Text>{engaged.toLocaleString()}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            참여율: {record.total_views > 0 ? Math.round((engaged / record.total_views) * 100) : 0}%
          </Text>
        </div>
      ),
    },
  ];

  const topSource = trafficData.sources && trafficData.sources.length > 0 ? trafficData.sources[0] : null;
  const insights = [];
  
  if (topSource) {
    insights.push({
      type: 'info',
      message: `주요 트래픽 소스는 "${topSource.type}"입니다 (${topSource.percentage}%)`,
    });
  }

  // 검색 트래픽이 높은 경우
  if (topSource && topSource.type === 'SEARCH' && topSource.percentage > 30) {
    insights.push({
      type: 'success',
      message: 'SEO 최적화가 잘 되어 있어 검색을 통한 유입이 많습니다.',
    });
  }

  // 추천 트래픽이 높은 경우
  if (topSource && topSource.type === 'BROWSE' && topSource.percentage > 40) {
    insights.push({
      type: 'success',
      message: 'YouTube 추천 알고리즘에 잘 노출되고 있습니다.',
    });
  }

  // 외부 트래픽이 높은 경우
  if (topSource && topSource.type === 'EXTERNAL' && topSource.percentage > 20) {
    insights.push({
      type: 'info',
      message: '외부 사이트 마케팅이 효과적입니다.',
    });
  }

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="🚪 트래픽 소스 분석" size="small">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="총 조회수"
                  value={trafficData.total_views}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="주요 소스"
                  value={topSource ? topSource.type.replace('_', ' ') : 'N/A'}
                  prefix={topSource ? getSourceIcon(topSource.type) : <BarChartOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="주요 소스 비율"
                  value={topSource ? topSource.percentage : 0}
                  precision={1}
                  suffix="%"
                  prefix={<BarChartOutlined />}
                />
              </Col>
            </Row>

            <Table
              dataSource={trafficData.sources.map((source, index) => ({
                key: index,
                ...source
              }))}
              columns={columns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 인사이트 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="💡 트래픽 인사이트" size="small">
            {insights.map((insight, index) => (
              <Alert
                key={index}
                message={insight.message}
                type={insight.type as any}
                showIcon
                style={{ marginBottom: index < insights.length - 1 ? 8 : 0 }}
              />
            ))}

            <div style={{ marginTop: 16 }}>
              <Title level={5}>📈 개선 제안</Title>
              <ul>
                {topSource && topSource.type === 'SEARCH' && (
                  <li>검색 최적화가 잘 되어 있습니다. 키워드 연구를 통해 더 많은 검색 트래픽을 유도해보세요.</li>
                )}
                {topSource && topSource.type === 'BROWSE' && (
                  <li>YouTube 추천 시스템에 잘 노출되고 있습니다. 일관된 업로드 스케줄을 유지해보세요.</li>
                )}
                {topSource && topSource.type === 'EXTERNAL' && (
                  <li>외부 마케팅이 효과적입니다. 소셜 미디어와 웹사이트 활용을 늘려보세요.</li>
                )}
                {topSource && topSource.percentage < 50 && (
                  <li>트래픽 소스가 다양화되어 있어 안정적입니다. 균형을 유지하세요.</li>
                )}
                <li>썸네일과 제목 최적화를 통해 클릭률을 더 높일 수 있습니다.</li>
                <li>시청자 유지율을 높이기 위해 영상 시작 부분을 더욱 매력적으로 만들어보세요.</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TrafficSourceAnalysis;