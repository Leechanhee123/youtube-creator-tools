import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tabs,
  Statistic,
  Progress,
  Table,
  Tag,
  Alert,
  Spin,
  Empty,
  Tooltip,
  Typography,
  Divider,
  Space,
  Select,
  Button,
} from 'antd';
import {
  EyeOutlined,
  PlayCircleOutlined,
  UserOutlined,
  MobileOutlined,
  DesktopOutlined,
  TabletOutlined,
  MonitorOutlined,
  GlobalOutlined,
  SearchOutlined,
  HeartOutlined,
  ShareAltOutlined,
  CommentOutlined,
  DollarOutlined,
  BarChartOutlined,
  ReloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import TrafficSourceAnalysis from './TrafficSourceAnalysis';
import DemographicsAnalysis from './DemographicsAnalysis';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ComprehensiveAnalyticsProps {
  channelId: string;
  channelData: any;
}

interface AnalyticsData {
  basic_metrics: any;
  traffic_sources: any;
  device_analysis: any;
  demographics: any;
  playback_locations: any;
  engagement_features: any;
  revenue_analysis: any;
  playlist_analysis: any;
  summary: any;
}

const ComprehensiveAnalytics: React.FC<ComprehensiveAnalyticsProps> = ({
  channelId,
  channelData
}) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [analysisPeriod, setAnalysisPeriod] = useState(30);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchComprehensiveAnalytics = async () => {
    if (!channelId || !accessToken) return;

    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/analytics/comprehensive?channel_id=${channelId}&days=${analysisPeriod}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setAnalyticsData(result.data);
        } else {
          console.error('Comprehensive analytics failed:', result.message);
        }
      } else {
        console.error('API Error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Comprehensive analytics error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComprehensiveAnalytics();
  }, [channelId, accessToken, analysisPeriod]);

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>종합 분석 데이터를 로딩 중입니다...</Text>
          </div>
        </div>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <Empty 
          description="종합 분석 데이터를 불러올 수 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toUpperCase()) {
      case 'MOBILE': return <MobileOutlined />;
      case 'COMPUTER': return <DesktopOutlined />;
      case 'TABLET': return <TabletOutlined />;
      case 'TV': return <MonitorOutlined />;
      default: return <GlobalOutlined />;
    }
  };

  const getTrafficSourceIcon = (sourceType: string) => {
    switch (sourceType.toUpperCase()) {
      case 'SEARCH': return <SearchOutlined />;
      case 'BROWSE': return <GlobalOutlined />;
      case 'RELATED_VIDEO': return <PlayCircleOutlined />;
      case 'EXTERNAL': return <GlobalOutlined />;
      default: return <BarChartOutlined />;
    }
  };

  const overviewTab = (
    <div>
      {/* 요약 정보 */}
      {analyticsData.summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="📊 분석 요약" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="총 조회수"
                    value={analyticsData.summary.total_views || 0}
                    prefix={<EyeOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="총 시청시간"
                    value={analyticsData.summary.total_watch_time_hours || 0}
                    precision={1}
                    suffix="시간"
                    prefix={<PlayCircleOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="참여율"
                    value={analyticsData.summary.engagement_rate || 0}
                    precision={1}
                    suffix="%"
                    prefix={<HeartOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="순 구독자 증가"
                    value={analyticsData.summary.net_subscribers || 0}
                    prefix={<UserOutlined />}
                    valueStyle={{ 
                      color: (analyticsData.summary.net_subscribers || 0) >= 0 ? '#52c41a' : '#f5222d' 
                    }}
                  />
                </Col>
              </Row>
              
              {analyticsData.summary.insights && analyticsData.summary.insights.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Title level={5}>🔍 주요 인사이트</Title>
                  {analyticsData.summary.insights.map((insight: string, index: number) => (
                    <Alert
                      key={index}
                      message={insight}
                      type="info"
                      showIcon
                      style={{ marginBottom: 8 }}
                    />
                  ))}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      )}

      {/* 기본 메트릭 */}
      {analyticsData.basic_metrics?.success && analyticsData.basic_metrics.data && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="📈 기본 성과 지표" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="총 조회수"
                    value={analyticsData.basic_metrics.data.totals.views}
                    prefix={<EyeOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="참여 조회수"
                    value={analyticsData.basic_metrics.data.totals.engaged_views}
                    prefix={<HeartOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="댓글 수"
                    value={analyticsData.basic_metrics.data.totals.comments}
                    prefix={<CommentOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="좋아요"
                    value={analyticsData.basic_metrics.data.totals.likes}
                    prefix={<HeartOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="공유 수"
                    value={analyticsData.basic_metrics.data.totals.shares}
                    prefix={<ShareAltOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={8}>
                  <Statistic
                    title="참여율"
                    value={analyticsData.basic_metrics.data.totals.engagement_rate}
                    precision={1}
                    suffix="%"
                    prefix={<BarChartOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  const trafficSourcesTab = (
    <TrafficSourceAnalysis 
      channelId={channelId} 
      days={analysisPeriod} 
    />
  );

  const deviceAnalysisTab = (
    <div>
      {analyticsData.device_analysis?.success && analyticsData.device_analysis.data && (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="📱 기기별 분석" size="small">
              <Table
                dataSource={Object.entries(analyticsData.device_analysis.data.devices).map(([device, data]: [string, any]) => ({
                  key: device,
                  device,
                  ...data
                }))}
                columns={[
                  {
                    title: '기기',
                    dataIndex: 'device',
                    key: 'device',
                    render: (device: string) => (
                      <Space>
                        {getDeviceIcon(device)}
                        <Text>{device}</Text>
                      </Space>
                    ),
                  },
                  {
                    title: '조회수',
                    dataIndex: 'views',
                    key: 'views',
                    render: (views: number) => views.toLocaleString(),
                  },
                  {
                    title: '비율',
                    dataIndex: 'percentage',
                    key: 'percentage',
                    render: (percentage: number) => `${percentage}%`,
                  },
                ]}
                pagination={false}
              />
            </Card>
          </Col>
          
          <Col xs={24} lg={12}>
            <Card title="💻 운영체제별 분석" size="small">
              <Table
                dataSource={Object.entries(analyticsData.device_analysis.data.operating_systems).map(([os, data]: [string, any]) => ({
                  key: os,
                  os,
                  ...data
                }))}
                columns={[
                  {
                    title: '운영체제',
                    dataIndex: 'os',
                    key: 'os',
                  },
                  {
                    title: '조회수',
                    dataIndex: 'views',
                    key: 'views',
                    render: (views: number) => views.toLocaleString(),
                  },
                  {
                    title: '비율',
                    dataIndex: 'percentage',
                    key: 'percentage',
                    render: (percentage: number) => `${percentage}%`,
                  },
                ]}
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );

  const demographicsTab = (
    <DemographicsAnalysis 
      channelId={channelId} 
      days={analysisPeriod} 
    />
  );

  const engagementTab = (
    <div>
      {analyticsData.engagement_features?.success && (
        <Row gutter={[16, 16]}>
          {analyticsData.engagement_features.data?.cards && (
            <Col xs={24} lg={12}>
              <Card title="🃏 카드 성과" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="노출 수"
                      value={analyticsData.engagement_features.data.cards.impressions}
                      prefix={<EyeOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="클릭 수"
                      value={analyticsData.engagement_features.data.cards.clicks}
                      prefix={<HeartOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="클릭률"
                      value={analyticsData.engagement_features.data.cards.click_rate}
                      precision={2}
                      suffix="%"
                      prefix={<BarChartOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
          
          {analyticsData.engagement_features.data?.end_screens && (
            <Col xs={24} lg={12}>
              <Card title="🎬 최종 화면 성과" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic
                      title="노출 수"
                      value={analyticsData.engagement_features.data.end_screens.impressions}
                      prefix={<EyeOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="클릭 수"
                      value={analyticsData.engagement_features.data.end_screens.clicks}
                      prefix={<HeartOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="클릭률"
                      value={analyticsData.engagement_features.data.end_screens.click_rate}
                      precision={2}
                      suffix="%"
                      prefix={<BarChartOutlined />}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          )}
        </Row>
      )}
      
      {(!analyticsData.engagement_features?.success || 
        (!analyticsData.engagement_features.data?.cards && !analyticsData.engagement_features.data?.end_screens)) && (
        <Card>
          <Empty 
            description="참여 기능 데이터를 사용할 수 없습니다"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );

  const revenueTab = (
    <div>
      {analyticsData.revenue_analysis?.success && analyticsData.revenue_analysis.data ? (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="💰 수익 분석" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="총 수익"
                    value={analyticsData.revenue_analysis.data.totals.gross_revenue}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="광고 수익"
                    value={analyticsData.revenue_analysis.data.totals.ad_revenue}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="평균 CPM"
                    value={analyticsData.revenue_analysis.data.totals.average_cpm}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="일평균 수익"
                    value={analyticsData.revenue_analysis.data.totals.daily_avg_revenue}
                    precision={2}
                    prefix={<DollarOutlined />}
                    suffix="USD"
                  />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card>
          <Alert
            message="수익 데이터 접근 제한"
            description="수익 데이터를 보려면 채널이 수익화되어 있어야 하며, YouTube Partner Program에 가입되어 있어야 합니다."
            type="warning"
            showIcon
          />
        </Card>
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'overview',
      label: '📊 개요',
      children: overviewTab,
    },
    {
      key: 'traffic',
      label: '🚪 트래픽 소스',
      children: trafficSourcesTab,
    },
    {
      key: 'devices',
      label: '📱 기기 분석',
      children: deviceAnalysisTab,
    },
    {
      key: 'demographics',
      label: '👥 인구통계',
      children: demographicsTab,
    },
    {
      key: 'engagement',
      label: '🎯 참여 기능',
      children: engagementTab,
    },
    {
      key: 'revenue',
      label: '💰 수익',
      children: revenueTab,
    },
  ];

  return (
    <div>
      {/* 헤더 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Space align="center">
                  <BarChartOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      종합 채널 분석
                    </Title>
                    <Text type="secondary">
                      YouTube Reporting API 기반 상세 분석
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Select
                    value={analysisPeriod}
                    onChange={setAnalysisPeriod}
                    style={{ width: 120 }}
                  >
                    <Option value={7}>최근 7일</Option>
                    <Option value={30}>최근 30일</Option>
                    <Option value={90}>최근 90일</Option>
                  </Select>
                  <Button 
                    icon={<ReloadOutlined />}
                    onClick={fetchComprehensiveAnalytics}
                    loading={loading}
                  >
                    새로고침
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 메인 콘텐츠 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Tabs 
              activeKey={activeTab}
              onChange={setActiveTab}
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ComprehensiveAnalytics;