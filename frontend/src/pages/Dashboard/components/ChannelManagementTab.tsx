import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Button,
  Space,
  Typography,
  Alert,
  Divider,
  List,
  Avatar,
  Tag,
  Tooltip,
  Select,
  DatePicker,
  Spin,
  Empty,
  notification,
} from 'antd';
import {
  DollarOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  BarChartOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import type { ChannelInfo } from '../../../types/api';
import ComprehensiveAnalytics from '../../../components/ComprehensiveAnalytics';
import CommentManagement from '../../../components/CommentManagement';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface ChannelManagementTabProps {
  channelData: ChannelInfo | null;
  onChannelAnalysis: () => void;
  channelLoading: boolean;
}

interface RevenueData {
  total_revenue: number;
  ad_revenue: number;
  partner_revenue: number;
  gross_revenue: number;
  period: string;
  currency: string;
  avg_daily_revenue: number;
  note?: string;
}

interface AnalyticsData {
  views: number;
  watch_time_minutes: number;
  watch_time_hours: number;
  subscribers_gained: number;
  subscribers_lost: number;
  net_subscribers: number;
  estimated_revenue: number;
  ad_revenue: number;
  period_days: number;
  avg_daily_views: number;
  avg_daily_revenue: number;
  note?: string;
}

interface UserChannel {
  channel_id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  subscriber_count: number;
  video_count: number;
  view_count: number;
}

const ChannelManagementTab: React.FC<ChannelManagementTabProps> = ({
  channelData,
  onChannelAnalysis,
  channelLoading
}) => {
  const { isAuthenticated, accessToken, refreshToken, user } = useAuth();
  const [userChannels, setUserChannels] = useState<UserChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [analysisPeriod, setAnalysisPeriod] = useState(30);

  // 사용자 채널 목록 조회
  const fetchUserChannels = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return;

    setChannelsLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const url = new URL(`${API_BASE_URL}/api/v1/auth/channels`);
      if (refreshToken) {
        url.searchParams.append('refresh_token', refreshToken);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserChannels(result.data);
          // 첫 번째 채널을 기본 선택
          if (result.data.length > 0) {
            setSelectedChannelId(result.data[0].channel_id);
          }
        } else {
          throw new Error(result.message || '채널 조회 실패');
        }
      } else {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('사용자 채널 조회 실패:', error);
      notification.error({
        message: '채널 조회 실패',
        description: '사용자 채널 목록을 불러올 수 없습니다.'
      });
    } finally {
      setChannelsLoading(false);
    }
  }, [isAuthenticated, accessToken, refreshToken]);

  // 채널 분석 데이터 조회
  const fetchChannelAnalytics = useCallback(async (channelId: string) => {
    console.log('fetchChannelAnalytics 호출:', { isAuthenticated, accessToken: !!accessToken, channelId });
    
    if (!isAuthenticated || !accessToken || !channelId) {
      console.error('필수 정보 누락:', { isAuthenticated, accessToken: !!accessToken, channelId });
      return;
    }

    setLoading(true);
    try {
      // 수익 및 분석 데이터 병렬 조회
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const [revenueResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/v1/auth/analytics/revenue?channel_id=${channelId}&days=${analysisPeriod}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }),
        fetch(`${API_BASE_URL}/api/v1/auth/analytics/summary?channel_id=${channelId}&days=${analysisPeriod}`, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        })
      ]);

      // 수익 데이터 처리
      if (revenueResponse.ok) {
        const revenueResult = await revenueResponse.json();
        if (revenueResult.success) {
          setRevenueData(revenueResult.data);
        }
      }

      // 분석 데이터 처리
      if (analyticsResponse.ok) {
        const analyticsResult = await analyticsResponse.json();
        console.log('Analytics API 응답:', analyticsResult);
        if (analyticsResult.success) {
          console.log('Analytics 데이터:', analyticsResult.data);
          setAnalyticsData(analyticsResult.data);
        } else {
          console.error('Analytics API 실패:', analyticsResult.message);
        }
      } else {
        console.error('Analytics API HTTP 에러:', analyticsResponse.status, await analyticsResponse.text());
      }

    } catch (error) {
      console.error('채널 분석 데이터 조회 실패:', error);
      notification.error({
        message: '분석 데이터 조회 실패',
        description: '채널 분석 데이터를 불러올 수 없습니다.'
      });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, accessToken, analysisPeriod]);

  // 선택된 채널 변경 시 분석 데이터 조회
  useEffect(() => {
    if (selectedChannelId) {
      fetchChannelAnalytics(selectedChannelId);
    }
  }, [selectedChannelId, fetchChannelAnalytics]);

  // 컴포넌트 마운트 시 사용자 채널 조회
  useEffect(() => {
    console.log('ChannelManagementTab: isAuthenticated =', isAuthenticated);
    console.log('ChannelManagementTab: accessToken =', accessToken ? '있음' : '없음');
    if (isAuthenticated) {
      fetchUserChannels();
    }
  }, [isAuthenticated, fetchUserChannels]);

  // 로그인하지 않은 경우
  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <UserOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
            <Title level={3}>채널 관리</Title>
            <Paragraph type="secondary">
              이 기능을 사용하려면 Google 계정으로 로그인해주세요.
              <br />
              로그인 후 내 채널의 수익 데이터, 분석 정보를 확인하고
              <br />
              댓글을 직접 관리할 수 있습니다.
            </Paragraph>
            <Button 
              type="primary" 
              size="large"
              onClick={async () => {
                try {
                  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
                  const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`);
                  const data = await response.json();
                  if (data.auth_url) {
                    window.location.href = data.auth_url;
                  }
                } catch (error) {
                  console.error('Login error:', error);
                }
              }}
            >
              Google 계정으로 로그인
            </Button>
          </Space>
        </Card>
      </div>
    );
  }

  const selectedChannel = userChannels.find(ch => ch.channel_id === selectedChannelId);

  return (
    <div style={{ padding: '24px' }}>
      {/* 헤더 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row justify="space-between" align="middle">
              <Col>
                <Space align="center">
                  <Avatar 
                    size="large" 
                    src={user?.picture} 
                    icon={<UserOutlined />} 
                  />
                  <div>
                    <Title level={4} style={{ margin: 0 }}>
                      안녕하세요, {user?.name}님
                    </Title>
                    <Text type="secondary">채널 관리 대시보드</Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Select
                    placeholder="분석 기간 선택"
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
                    onClick={() => selectedChannelId && fetchChannelAnalytics(selectedChannelId)}
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

      {/* 내 채널 목록 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="📺 내 채널 목록" loading={channelsLoading}>
            {userChannels.length === 0 ? (
              <Empty 
                description="연결된 채널이 없습니다"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <List
                dataSource={userChannels}
                renderItem={(channel) => (
                  <List.Item
                    actions={[
                      <Button
                        type={selectedChannelId === channel.channel_id ? 'primary' : 'default'}
                        size="small"
                        onClick={() => setSelectedChannelId(channel.channel_id)}
                      >
                        {selectedChannelId === channel.channel_id ? '선택됨' : '선택'}
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar 
                          size="large"
                          src={channel.thumbnail_url} 
                          icon={<PlayCircleOutlined />}
                        />
                      }
                      title={channel.title}
                      description={
                        <Space split={<Divider type="vertical" />}>
                          <Text>구독자 {channel.subscriber_count.toLocaleString()}명</Text>
                          <Text>동영상 {channel.video_count}개</Text>
                          <Text>총 조회수 {channel.view_count.toLocaleString()}회</Text>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 선택된 채널 정보 및 수익 데이터 */}
      {selectedChannel && (
        <>
          {/* 수익 정보 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card 
                title={`💰 수익 분석 (최근 ${analysisPeriod}일)`}
                loading={loading}
                extra={
                  <Tag color="green">
                    {revenueData?.currency || 'USD'}
                  </Tag>
                }
              >
                {revenueData ? (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="총 수익"
                          value={revenueData.total_revenue}
                          precision={2}
                          prefix={<DollarOutlined />}
                          suffix={revenueData.currency}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="광고 수익"
                          value={revenueData.ad_revenue}
                          precision={2}
                          prefix={<DollarOutlined />}
                          suffix={revenueData.currency}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="일평균 수익"
                          value={revenueData.avg_daily_revenue}
                          precision={2}
                          prefix={<CalendarOutlined />}
                          suffix={revenueData.currency}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="총 매출"
                          value={revenueData.gross_revenue}
                          precision={2}
                          prefix={<TrophyOutlined />}
                          suffix={revenueData.currency}
                        />
                      </Col>
                    </Row>
                    {revenueData.note && (
                      <Alert
                        message="수익 데이터 안내"
                        description={revenueData.note}
                        type="warning"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </div>
                ) : (
                  <Alert
                    message="수익 데이터 없음"
                    description="선택한 기간의 수익 데이터가 없거나 수익화가 활성화되지 않았습니다."
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* 분석 데이터 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card 
                title={`📊 채널 분석 (최근 ${analysisPeriod}일)`}
                loading={loading}
              >
                {analyticsData ? (
                  <div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="총 조회수"
                          value={analyticsData.views}
                          prefix={<EyeOutlined />}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="시청 시간"
                          value={analyticsData.watch_time_hours}
                          precision={1}
                          suffix="시간"
                          prefix={<PlayCircleOutlined />}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="구독자 순증가"
                          value={analyticsData.net_subscribers}
                          prefix={<UserOutlined />}
                          valueStyle={{ color: analyticsData.net_subscribers >= 0 ? '#52c41a' : '#f5222d' }}
                        />
                      </Col>
                      <Col xs={24} sm={12} md={6}>
                        <Statistic
                          title="일평균 조회수"
                          value={analyticsData.avg_daily_views}
                          precision={0}
                          prefix={<BarChartOutlined />}
                        />
                      </Col>
                    </Row>
                    {analyticsData.note && (
                      <Alert
                        message="분석 데이터 안내"
                        description={analyticsData.note}
                        type="warning"
                        showIcon
                        style={{ marginTop: 16 }}
                      />
                    )}
                  </div>
                ) : (
                  <Alert
                    message="분석 데이터 없음"
                    description="선택한 기간의 분석 데이터가 없습니다."
                    type="info"
                    showIcon
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* 종합 분석 섹션 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <ComprehensiveAnalytics 
                channelId={selectedChannelId}
                channelData={selectedChannel}
              />
            </Col>
          </Row>

          {/* 댓글 관리 섹션 */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <CommentManagement channelId={selectedChannelId} />
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default ChannelManagementTab;