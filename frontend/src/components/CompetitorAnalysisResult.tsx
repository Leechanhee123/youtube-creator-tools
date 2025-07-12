import React from 'react';
import { Card, Table, Tag, Progress, Statistic, Row, Col, Alert, Collapse, Typography, Divider } from 'antd';
import { 
  TrophyOutlined, 
  RiseOutlined, 
  EyeOutlined,
  UserOutlined,
  PlayCircleOutlined,
  BulbOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import type { CompetitorAnalysisData } from '../types/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface CompetitorAnalysisResultProps {
  data: CompetitorAnalysisData;
  loading?: boolean;
}

const CompetitorAnalysisResult: React.FC<CompetitorAnalysisResultProps> = ({ data, loading = false }) => {
  // 숫자 포맷팅 함수
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // 비율을 백분율로 변환
  const formatRatio = (ratio: number): string => {
    const percentage = ((ratio - 1) * 100);
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
  };

  // 우선순위별 색상
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  // 시장 위치별 색상 및 아이콘
  const getMarketPositionInfo = (position: string) => {
    switch (position) {
      case 'top':
        return { color: 'green', icon: <TrophyOutlined />, text: '상위권' };
      case 'middle':
        return { color: 'orange', icon: <BarChartOutlined />, text: '중위권' };
      case 'bottom':
        return { color: 'red', icon: <RiseOutlined />, text: '하위권 (성장 기회)' };
      default:
        return { color: 'blue', icon: <BarChartOutlined />, text: '분석 중' };
    }
  };

  // 경쟁사 테이블 컬럼 정의
  const competitorColumns = [
    {
      title: '채널명',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (title: string, record: any) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            유사도: {(record.similarity_score * 100).toFixed(1)}%
          </Text>
        </div>
      ),
    },
    {
      title: '구독자 수',
      dataIndex: ['channel_stats', 'subscriber_count'],
      key: 'subscribers',
      width: 120,
      render: (count: number, record: any) => (
        <div>
          <Text strong>{formatNumber(count)}</Text>
          <br />
          <Text 
            type={record.performance_comparison.subscriber_ratio > 1 ? 'success' : 'danger'}
            style={{ fontSize: '12px' }}
          >
            {formatRatio(record.performance_comparison.subscriber_ratio)}
          </Text>
        </div>
      ),
    },
    {
      title: '평균 조회수',
      key: 'avg_views',
      width: 120,
      render: (record: any) => {
        const avgViews = record.channel_stats.view_count / Math.max(record.channel_stats.video_count, 1);
        return (
          <div>
            <Text strong>{formatNumber(avgViews)}</Text>
            <br />
            <Text 
              type={record.performance_comparison.avg_views_per_video_ratio > 1 ? 'success' : 'danger'}
              style={{ fontSize: '12px' }}
            >
              {formatRatio(record.performance_comparison.avg_views_per_video_ratio)}
            </Text>
          </div>
        );
      },
    },
    {
      title: '콘텐츠 특징',
      key: 'content_insights',
      render: (record: any) => (
        <div>
          <div style={{ marginBottom: '4px' }}>
            <Text style={{ fontSize: '12px' }}>
              제목: {record.content_insights.avg_title_length.toFixed(0)}자
            </Text>
          </div>
          <div>
            {record.content_insights.common_title_patterns.slice(0, 2).map((pattern: string, index: number) => (
              <Tag key={index} style={{ marginBottom: '2px', fontSize: '12px' }}>
                {pattern}
              </Tag>
            ))}
          </div>
        </div>
      ),
    },
  ];

  const marketPositionInfo = getMarketPositionInfo(data.market_insights.market_position);

  return (
    <div style={{ padding: '16px' }}>
      {/* 헤더 - 대상 채널 정보 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Statistic
              title="분석 대상 채널"
              value={data.target_channel.title}
              valueStyle={{ fontSize: '16px', fontWeight: 'bold' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="구독자 수"
              value={formatNumber(data.target_channel.subscriber_count)}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="총 비디오"
              value={data.target_channel.video_count}
              prefix={<PlayCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="총 조회수"
              value={formatNumber(data.target_channel.view_count)}
              prefix={<EyeOutlined />}
            />
          </Col>
        </Row>
      </Card>

      {/* 시장 인사이트 요약 */}
      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="시장 위치"
              value={marketPositionInfo.text}
              prefix={marketPositionInfo.icon}
              valueStyle={{ color: marketPositionInfo.color }}
            />
            <Paragraph style={{ marginTop: '8px', fontSize: '12px' }}>
              {data.market_insights.competitive_advantage}
            </Paragraph>
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="분석된 경쟁사"
              value={`${data.competitors.length}개`}
              suffix={`/ ${data.analysis_metadata.total_competitors_found}개 발견`}
              prefix={<BarChartOutlined />}
            />
            <Paragraph style={{ marginTop: '8px', fontSize: '12px' }}>
              시장 평균 구독자: {formatNumber(data.market_insights.market_avg_subscribers)}
            </Paragraph>
          </Card>
        </Col>
      </Row>

      {/* 전략적 제안 */}
      <Card title={<><BulbOutlined /> 전략적 제안</>} style={{ marginBottom: '16px' }}>
        {data.strategic_recommendations.length > 0 ? (
          data.strategic_recommendations.map((recommendation, index) => (
            <Alert
              key={index}
              message={recommendation.suggestion}
              description={`영향: ${recommendation.impact} | 타입: ${recommendation.type}`}
              type={recommendation.priority === 'high' ? 'error' : recommendation.priority === 'medium' ? 'warning' : 'info'}
              style={{ marginBottom: '8px' }}
              action={
                <Tag color={getPriorityColor(recommendation.priority)}>
                  {recommendation.priority.toUpperCase()}
                </Tag>
              }
            />
          ))
        ) : (
          <Text type="secondary">현재 특별한 개선 제안이 없습니다. 좋은 성과를 유지하고 있습니다!</Text>
        )}
      </Card>

      {/* 성장 기회 */}
      {data.market_insights.growth_opportunities.length > 0 && (
        <Card title="🚀 성장 기회" style={{ marginBottom: '16px' }}>
          {data.market_insights.growth_opportunities.map((opportunity, index) => (
            <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
              {opportunity}
            </Tag>
          ))}
        </Card>
      )}

      {/* 경쟁사 상세 분석 */}
      <Card title="📊 경쟁사 상세 분석">
        <Table
          columns={competitorColumns}
          dataSource={data.competitors.map((competitor, index) => ({
            ...competitor,
            key: competitor.channel_id || index,
          }))}
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          loading={loading}
        />

        {/* 상세 분석 정보 (접을 수 있음) */}
        <Divider />
        <Collapse>
          <Panel header="📈 상세 성과 비교" key="performance">
            {data.competitors.map((competitor) => (
              <Card key={competitor.channel_id} size="small" style={{ marginBottom: '8px' }}>
                <Title level={5}>{competitor.title}</Title>
                <Row gutter={16}>
                  <Col span={6}>
                    <Text strong>구독자 비율: </Text>
                    <Text type={competitor.performance_comparison.subscriber_ratio > 1 ? 'success' : 'danger'}>
                      {formatRatio(competitor.performance_comparison.subscriber_ratio)}
                    </Text>
                  </Col>
                  <Col span={6}>
                    <Text strong>조회수 비율: </Text>
                    <Text type={competitor.performance_comparison.view_ratio > 1 ? 'success' : 'danger'}>
                      {formatRatio(competitor.performance_comparison.view_ratio)}
                    </Text>
                  </Col>
                  <Col span={6}>
                    <Text strong>업로드 패턴: </Text>
                    <Text>{competitor.content_insights.upload_pattern.upload_frequency}</Text>
                  </Col>
                  <Col span={6}>
                    <Text strong>유사도: </Text>
                    <Progress 
                      percent={competitor.similarity_score * 100} 
                      size="small" 
                      format={percent => `${percent?.toFixed(1)}%`}
                    />
                  </Col>
                </Row>
              </Card>
            ))}
          </Panel>
          
          <Panel header="🎯 콘텐츠 전략 인사이트" key="content">
            {data.competitors.map((competitor) => (
              <Card key={competitor.channel_id} size="small" style={{ marginBottom: '8px' }}>
                <Title level={5}>{competitor.title}</Title>
                <Row gutter={16}>
                  <Col span={8}>
                    <Text strong>평균 제목 길이: </Text>
                    <Text>{competitor.content_insights.avg_title_length.toFixed(0)}자</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>주요 업로드 요일: </Text>
                    <Text>{competitor.content_insights.upload_pattern.most_common_upload_day || '분석 중'}</Text>
                  </Col>
                  <Col span={8}>
                    <Text strong>평균 업로드 시간: </Text>
                    <Text>
                      {competitor.content_insights.upload_pattern.avg_upload_hour ? 
                        `${competitor.content_insights.upload_pattern.avg_upload_hour.toFixed(0)}시` : 
                        '분석 중'
                      }
                    </Text>
                  </Col>
                </Row>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>제목 패턴: </Text>
                  {competitor.content_insights.common_title_patterns.map((pattern, idx) => (
                    <Tag key={idx} style={{ marginRight: '4px' }}>{pattern}</Tag>
                  ))}
                </div>
              </Card>
            ))}
          </Panel>
        </Collapse>

        {/* 분석 메타데이터 */}
        <Divider />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          분석 기간: {data.analysis_metadata.analysis_period} | 
          분석 완료: {new Date(data.analysis_metadata.analyzed_at).toLocaleString()} |
          발견된 경쟁사: {data.analysis_metadata.total_competitors_found}개
        </Text>
      </Card>
    </div>
  );
};

export default CompetitorAnalysisResult;