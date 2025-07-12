import React from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Alert,
  List,
  Progress,
  Divider,
  Collapse,
  Table,
  Tooltip,
  Badge,
} from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  BulbOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TagOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { SEOAnalysisData, SEORecommendation } from '../types/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface SEOAnalysisResultProps {
  data: SEOAnalysisData;
}

const SEOAnalysisResultComponent: React.FC<SEOAnalysisResultProps> = ({ data }) => {
  // 우선순위별 색상 매핑
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'green';
      default: return 'blue';
    }
  };

  // 영향도별 아이콘
  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <ThunderboltOutlined style={{ color: '#ff4d4f' }} />;
      case 'medium': return <RiseOutlined style={{ color: '#faad14' }} />;
      case 'low': return <InfoCircleOutlined style={{ color: '#52c41a' }} />;
      default: return <InfoCircleOutlined />;
    }
  };

  // 키워드 사용량 차트 데이터
  const getKeywordComparisonData = () => {
    const topKeywords = data.analysis_groups.top_videos.analysis.title_analysis.keyword_usage;
    const bottomKeywords = data.analysis_groups.bottom_videos.analysis.title_analysis.keyword_usage;
    
    return [
      {
        key: 'attention_grabbing',
        name: '관심 유발 키워드',
        top: topKeywords.attention_grabbing,
        bottom: bottomKeywords.attention_grabbing,
      },
      {
        key: 'question_words',
        name: '질문형 키워드',
        top: topKeywords.question_words,
        bottom: bottomKeywords.question_words,
      },
      {
        key: 'trending_words',
        name: '트렌드 키워드',
        top: topKeywords.trending_words,
        bottom: bottomKeywords.trending_words,
      },
      {
        key: 'emotional_words',
        name: '감정 키워드',
        top: topKeywords.emotional_words,
        bottom: bottomKeywords.emotional_words,
      },
    ];
  };

  const keywordData = getKeywordComparisonData();

  return (
    <div>
      {/* 전체 요약 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Title level={3} style={{ marginBottom: 16 }}>
              📊 SEO 분석 요약
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="분석 대상 비디오"
                  value={data.total_videos}
                  prefix={<EyeOutlined />}
                  suffix="개"
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="상위 그룹 평균 조회수"
                  value={Math.round(data.analysis_groups.top_videos.analysis.statistics.avg_views)}
                  prefix={<TrophyOutlined />}
                  precision={0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="하위 그룹 평균 조회수"
                  value={Math.round(data.analysis_groups.bottom_videos.analysis.statistics.avg_views)}
                  prefix={<FallOutlined />}
                  precision={0}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="성능 격차"
                  value={data.comparison.view_performance.performance_gap}
                  prefix={<RiseOutlined />}
                  suffix="배"
                  precision={1}
                  valueStyle={{ color: data.comparison.view_performance.performance_gap > 3 ? '#cf1322' : '#3f8600' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 개선 제안 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title={
            <span>
              <BulbOutlined style={{ marginRight: 8 }} />
              SEO 개선 제안
            </span>
          }>
            <List
              dataSource={data.recommendations}
              renderItem={(item: SEORecommendation) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={getImpactIcon(item.impact)}
                    title={
                      <div>
                        <Text strong>{item.category}</Text>
                        <Tag color={getPriorityColor(item.priority)} style={{ marginLeft: 8 }}>
                          {item.priority === 'high' ? '높음' : 
                           item.priority === 'medium' ? '보통' : '낮음'}
                        </Tag>
                      </div>
                    }
                    description={item.suggestion}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 상세 비교 분석 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="📋 상세 비교 분석">
            <Collapse>
              {/* 제목 분석 */}
              <Panel header="제목 분석" key="title">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="상위 조회수 그룹">
                      <Statistic
                        title="평균 제목 길이"
                        value={data.analysis_groups.top_videos.analysis.title_analysis.avg_length}
                        suffix="자"
                        precision={1}
                      />
                      <Divider />
                      <Statistic
                        title="평균 단어 수"
                        value={data.analysis_groups.top_videos.analysis.title_analysis.avg_word_count}
                        suffix="개"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="하위 조회수 그룹">
                      <Statistic
                        title="평균 제목 길이"
                        value={data.analysis_groups.bottom_videos.analysis.title_analysis.avg_length}
                        suffix="자"
                        precision={1}
                      />
                      <Divider />
                      <Statistic
                        title="평균 단어 수"
                        value={data.analysis_groups.bottom_videos.analysis.title_analysis.avg_word_count}
                        suffix="개"
                        precision={1}
                      />
                    </Card>
                  </Col>
                </Row>

                <Divider />
                
                {/* 키워드 사용 비교 */}
                <Title level={5}>키워드 사용 비교</Title>
                <Table
                  dataSource={keywordData}
                  size="small"
                  pagination={false}
                  columns={[
                    {
                      title: '키워드 유형',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: '상위 그룹',
                      dataIndex: 'top',
                      key: 'top',
                      render: (value: number) => (
                        <Badge count={value} color="green" />
                      ),
                    },
                    {
                      title: '하위 그룹',
                      dataIndex: 'bottom',
                      key: 'bottom',
                      render: (value: number) => (
                        <Badge count={value} color="red" />
                      ),
                    },
                    {
                      title: '차이',
                      key: 'diff',
                      render: (record: any) => {
                        const diff = record.top - record.bottom;
                        return (
                          <span style={{ color: diff > 0 ? '#52c41a' : '#f5222d' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        );
                      },
                    },
                  ]}
                />
              </Panel>

              {/* 설명 분석 */}
              <Panel header="설명 분석" key="description">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="상위 조회수 그룹">
                      <Statistic
                        title="평균 설명 길이"
                        value={data.analysis_groups.top_videos.analysis.description_analysis.avg_length}
                        suffix="자"
                        precision={0}
                      />
                      <Divider />
                      <Statistic
                        title="평균 링크 수"
                        value={data.analysis_groups.top_videos.analysis.description_analysis.avg_links}
                        suffix="개"
                        precision={1}
                      />
                      <Divider />
                      <Statistic
                        title="평균 해시태그 수"
                        value={data.analysis_groups.top_videos.analysis.description_analysis.avg_hashtags}
                        suffix="개"
                        precision={1}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="하위 조회수 그룹">
                      <Statistic
                        title="평균 설명 길이"
                        value={data.analysis_groups.bottom_videos.analysis.description_analysis.avg_length}
                        suffix="자"
                        precision={0}
                      />
                      <Divider />
                      <Statistic
                        title="평균 링크 수"
                        value={data.analysis_groups.bottom_videos.analysis.description_analysis.avg_links}
                        suffix="개"
                        precision={1}
                      />
                      <Divider />
                      <Statistic
                        title="평균 해시태그 수"
                        value={data.analysis_groups.bottom_videos.analysis.description_analysis.avg_hashtags}
                        suffix="개"
                        precision={1}
                      />
                    </Card>
                  </Col>
                </Row>
              </Panel>

              {/* 업로드 시간 분석 */}
              <Panel header="업로드 시간 분석" key="timing">
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="상위 조회수 그룹">
                      <Text strong>최빈 업로드 시간: </Text>
                      <Text>
                        {data.analysis_groups.top_videos.analysis.upload_time_analysis.most_common_hour.hour}시
                        ({data.analysis_groups.top_videos.analysis.upload_time_analysis.most_common_hour.count}회)
                      </Text>
                      <br />
                      <Text strong>최빈 업로드 요일: </Text>
                      <Text>
                        {data.analysis_groups.top_videos.analysis.upload_time_analysis.most_common_day.day_name}
                        ({data.analysis_groups.top_videos.analysis.upload_time_analysis.most_common_day.count}회)
                      </Text>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="하위 조회수 그룹">
                      <Text strong>최빈 업로드 시간: </Text>
                      <Text>
                        {data.analysis_groups.bottom_videos.analysis.upload_time_analysis.most_common_hour.hour}시
                        ({data.analysis_groups.bottom_videos.analysis.upload_time_analysis.most_common_hour.count}회)
                      </Text>
                      <br />
                      <Text strong>최빈 업로드 요일: </Text>
                      <Text>
                        {data.analysis_groups.bottom_videos.analysis.upload_time_analysis.most_common_day.day_name}
                        ({data.analysis_groups.bottom_videos.analysis.upload_time_analysis.most_common_day.count}회)
                      </Text>
                    </Card>
                  </Col>
                </Row>
              </Panel>
            </Collapse>
          </Card>
        </Col>
      </Row>

      {/* 도움말 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="SEO 분석 도움말"
            description={
              <div>
                <p>• <strong>성능 격차:</strong> 상위 그룹과 하위 그룹의 평균 조회수 비율</p>
                <p>• <strong>키워드 분석:</strong> 제목에 사용된 다양한 유형의 키워드 빈도</p>
                <p>• <strong>우선순위:</strong> 높음(즉시 적용), 보통(점진적 개선), 낮음(장기적 고려)</p>
                <p>• 이 분석은 상위 {Math.round(data.percentile_threshold * 100)}%와 하위 {Math.round(data.percentile_threshold * 100)}% 비디오를 비교한 결과입니다</p>
              </div>
            }
            type="info"
            showIcon
            closable
          />
        </Col>
      </Row>
    </div>
  );
};

export default SEOAnalysisResultComponent;