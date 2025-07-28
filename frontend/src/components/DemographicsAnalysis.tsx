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
  Alert,
  Spin,
  Empty,
  Divider,
} from 'antd';
import {
  UserOutlined,
  ManOutlined,
  WomanOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface DemographicsAnalysisProps {
  channelId: string;
  days: number;
}

interface DemographicsData {
  age_groups: Record<string, {
    male: number;
    female: number;
    total: number;
  }>;
  gender_distribution: {
    male: number;
    female: number;
  };
  dominant_age_group: string;
  dominant_gender: string;
}

const DemographicsAnalysis: React.FC<DemographicsAnalysisProps> = ({
  channelId,
  days
}) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demographicsData, setDemographicsData] = useState<DemographicsData | null>(null);

  const fetchDemographics = async () => {
    if (!channelId || !accessToken) return;

    setLoading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/analytics/demographics?channel_id=${channelId}&days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDemographicsData(result.data);
        }
      }
    } catch (error) {
      console.error('Demographics fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographics();
  }, [channelId, accessToken, days]);

  const getAgeGroupLabel = (ageGroup: string) => {
    const labels: Record<string, string> = {
      'age13-17': '13-17세',
      'age18-24': '18-24세',
      'age25-34': '25-34세',
      'age35-44': '35-44세',
      'age45-54': '45-54세',
      'age55-64': '55-64세',
      'age65-': '65세 이상',
    };
    return labels[ageGroup] || ageGroup;
  };

  const getAgeGroupColor = (ageGroup: string) => {
    const colors: Record<string, string> = {
      'age13-17': '#ff4d4f',
      'age18-24': '#ff7a45',
      'age25-34': '#ffa940',
      'age35-44': '#52c41a',
      'age45-54': '#1890ff',
      'age55-64': '#722ed1',
      'age65-': '#eb2f96',
    };
    return colors[ageGroup] || '#666';
  };

  if (loading) {
    return (
      <Card title="👥 시청자 인구통계 분석" loading={loading}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!demographicsData) {
    return (
      <Card title="👥 시청자 인구통계 분석">
        <Empty 
          description="인구통계 데이터를 불러올 수 없습니다"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const ageGroupColumns = [
    {
      title: '연령대',
      dataIndex: 'age_group',
      key: 'age_group',
      render: (ageGroup: string) => (
        <Tag color={getAgeGroupColor(ageGroup)}>
          {getAgeGroupLabel(ageGroup)}
        </Tag>
      ),
    },
    {
      title: '남성',
      dataIndex: 'male',
      key: 'male',
      render: (value: number) => (
        <Space>
          <ManOutlined style={{ color: '#1890ff' }} />
          <Text>{value.toFixed(1)}%</Text>
        </Space>
      ),
    },
    {
      title: '여성',
      dataIndex: 'female',
      key: 'female',
      render: (value: number) => (
        <Space>
          <WomanOutlined style={{ color: '#f5222d' }} />
          <Text>{value.toFixed(1)}%</Text>
        </Space>
      ),
    },
    {
      title: '전체 비율',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => (
        <div style={{ minWidth: '120px' }}>
          <Progress 
            percent={value} 
            size="small" 
            format={() => `${value.toFixed(1)}%`}
            strokeColor={getAgeGroupColor}
          />
        </div>
      ),
      sorter: (a: any, b: any) => a.total - b.total,
      defaultSortOrder: 'descend' as const,
    },
  ];

  const ageGroupData = demographicsData?.age_groups 
    ? Object.entries(demographicsData.age_groups).map(([ageGroup, data]) => ({
        key: ageGroup,
        age_group: ageGroup,
        ...data
      }))
    : [];

  const generateInsights = () => {
    const insights = [];
    
    if (!demographicsData) return insights;
    
    // 주요 연령대
    if (demographicsData.dominant_age_group) {
      insights.push({
        type: 'info',
        message: `주요 시청층은 ${getAgeGroupLabel(demographicsData.dominant_age_group)} 연령대입니다.`,
      });
    }

    // 성별 분포
    if (demographicsData.gender_distribution) {
      const { male, female } = demographicsData.gender_distribution;
      const genderDiff = Math.abs(male - female);
    
      if (genderDiff < 10) {
        insights.push({
          type: 'success',
          message: '성별 분포가 균형적입니다. 다양한 시청자층에게 어필하고 있습니다.',
        });
      } else if (male > female) {
        insights.push({
          type: 'info',
          message: `남성 시청자가 ${male.toFixed(1)}%로 다수를 차지합니다.`,
        });
      } else {
        insights.push({
          type: 'info',
          message: `여성 시청자가 ${female.toFixed(1)}%로 다수를 차지합니다.`,
        });
      }
    }

    // 연령대별 분석
    if (demographicsData.age_groups) {
      const youngAudience = (demographicsData.age_groups['age13-17']?.total || 0) + 
                           (demographicsData.age_groups['age18-24']?.total || 0);
      const matureAudience = (demographicsData.age_groups['age35-44']?.total || 0) + 
                            (demographicsData.age_groups['age45-54']?.total || 0) +
                            (demographicsData.age_groups['age55-64']?.total || 0) +
                            (demographicsData.age_groups['age65-']?.total || 0);

      if (youngAudience > 40) {
        insights.push({
          type: 'info',
          message: '젊은 시청자층(13-24세)이 많습니다. 트렌디한 콘텐츠와 소셜 미디어 마케팅을 활용해보세요.',
        });
      }

      if (matureAudience > 30) {
        insights.push({
          type: 'info',
          message: '성숙한 시청자층(35세 이상)이 많습니다. 깊이 있는 콘텐츠와 전문성을 강조해보세요.',
        });
      }
    }


    return insights;
  };

  const insights = generateInsights();

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="👥 시청자 인구통계 분석" size="small">
            {/* 성별 분포 요약 */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={24} md={8}>
                <Statistic
                  title="남성 시청자"
                  value={demographicsData?.gender_distribution?.male || 0}
                  precision={1}
                  suffix="%"
                  prefix={<ManOutlined style={{ color: '#1890ff' }} />}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="여성 시청자"
                  value={demographicsData?.gender_distribution?.female || 0}
                  precision={1}
                  suffix="%"
                  prefix={<WomanOutlined style={{ color: '#f5222d' }} />}
                />
              </Col>
              <Col xs={24} md={8}>
                <Statistic
                  title="주요 연령대"
                  value={demographicsData?.dominant_age_group ? getAgeGroupLabel(demographicsData.dominant_age_group) : 'N/A'}
                  prefix={<TeamOutlined />}
                />
              </Col>
            </Row>

            <Divider>연령대별 상세 분석</Divider>

            {/* 연령대별 테이블 */}
            <Table
              dataSource={ageGroupData}
              columns={ageGroupColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* 성별 분포 차트 (진행률 바로 표현) */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="⚧ 성별 분포" size="small">
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8 }}>
                <Text>남성</Text>
                <Progress 
                  percent={demographicsData?.gender_distribution?.male || 0} 
                  strokeColor="#1890ff"
                  format={() => `${(demographicsData?.gender_distribution?.male || 0).toFixed(1)}%`}
                />
              </div>
              <div>
                <Text>여성</Text>
                <Progress 
                  percent={demographicsData?.gender_distribution?.female || 0} 
                  strokeColor="#f5222d"
                  format={() => `${(demographicsData?.gender_distribution?.female || 0).toFixed(1)}%`}
                />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="🎯 연령대 분포" size="small">
            {demographicsData?.age_groups ? Object.entries(demographicsData.age_groups)
              .sort(([,a], [,b]) => b.total - a.total)
              .slice(0, 5)
              .map(([ageGroup, data]) => (
                <div key={ageGroup} style={{ marginBottom: 8 }}>
                  <Text>{getAgeGroupLabel(ageGroup)}</Text>
                  <Progress 
                    percent={data.total} 
                    strokeColor={getAgeGroupColor(ageGroup)}
                    format={() => `${data.total.toFixed(1)}%`}
                  />
                </div>
              )) : (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">연령대 데이터가 없습니다</Text>
                </div>
              )
            }
          </Card>
        </Col>
      </Row>

      {/* 인사이트 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="💡 인구통계 인사이트" size="small">
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
              <Title level={5}>📈 타겟 최적화 제안</Title>
              <ul>
                {demographicsData?.dominant_age_group === 'age18-24' && (
                  <li>18-24세 연령대가 주요 시청자입니다. 트렌드에 민감한 콘텐츠를 제작해보세요.</li>
                )}
                {demographicsData?.dominant_age_group === 'age25-34' && (
                  <li>25-34세 연령대가 주요 시청자입니다. 전문성과 실용성을 강조한 콘텐츠가 효과적입니다.</li>
                )}
                {demographicsData?.gender_distribution?.male > 60 && (
                  <li>남성 시청자가 많습니다. 여성 시청자 유입을 위한 콘텐츠 다양화를 고려해보세요.</li>
                )}
                {demographicsData?.gender_distribution?.female > 60 && (
                  <li>여성 시청자가 많습니다. 남성 시청자 유입을 위한 콘텐츠 다양화를 고려해보세요.</li>
                )}
                <li>주요 시청자층의 관심사와 라이프스타일을 고려한 콘텐츠 기획을 해보세요.</li>
                <li>시청자 댓글과 피드백을 분석하여 타겟 오디언스를 더 정확히 파악해보세요.</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DemographicsAnalysis;