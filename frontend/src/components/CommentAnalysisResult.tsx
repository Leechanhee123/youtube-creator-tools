import React, { useState, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Typography,
  Tag,
  Button,
  Space,
  Collapse,
  Alert,
  Checkbox,
  Progress,
  Badge,
  List,
  Avatar,
  Divider,
  Modal,
  notification,
} from 'antd';
import {
  WarningOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MessageOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { CommentAnalysisResult, DuplicateGroup } from '../types/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface CommentAnalysisResultProps {
  data: CommentAnalysisResult;
  onDeleteComments?: (commentIds: string[]) => void;
  loading?: boolean;
}

const CommentAnalysisResultComponent: React.FC<CommentAnalysisResultProps> = ({
  data,
  onDeleteComments,
  loading = false,
}) => {
  const [selectedCommentIds, setSelectedCommentIds] = useState<string[]>([]);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewGroup, setPreviewGroup] = useState<DuplicateGroup | null>(null);

  // 댓글 선택/해제 핸들러
  const handleCommentSelection = useCallback((commentIds: string[], selected: boolean) => {
    setSelectedCommentIds(prev => {
      if (selected) {
        return [...new Set([...prev, ...commentIds])];
      } else {
        return prev.filter(id => !commentIds.includes(id));
      }
    });
  }, []);

  // 전체 선택/해제
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      setSelectedCommentIds(data.suspicious_comment_ids);
    } else {
      setSelectedCommentIds([]);
    }
  }, [data.suspicious_comment_ids]);

  // 선택된 댓글 삭제
  const handleDeleteSelected = useCallback(() => {
    if (selectedCommentIds.length === 0) {
      notification.warning({
        message: '선택된 댓글이 없습니다',
        description: '삭제할 댓글을 선택해주세요.',
      });
      return;
    }

    Modal.confirm({
      title: '댓글 삭제 확인',
      content: `선택된 ${selectedCommentIds.length}개의 댓글을 삭제하시겠습니까?`,
      icon: <ExclamationCircleOutlined />,
      okText: '삭제',
      cancelText: '취소',
      okType: 'danger',
      onOk: () => {
        onDeleteComments?.(selectedCommentIds);
        setSelectedCommentIds([]);
      },
    });
  }, [selectedCommentIds, onDeleteComments]);

  // 그룹 미리보기
  const showGroupPreview = useCallback((group: DuplicateGroup) => {
    setPreviewGroup(group);
    setPreviewModalVisible(true);
  }, []);

  // 중복 그룹 테이블 컬럼
  const duplicateGroupColumns = [
    {
      title: '선택',
      key: 'select',
      width: 60,
      render: (group: DuplicateGroup) => (
        <Checkbox
          checked={group.comment_ids.every(id => selectedCommentIds.includes(id))}
          indeterminate={group.comment_ids.some(id => selectedCommentIds.includes(id)) && 
                        !group.comment_ids.every(id => selectedCommentIds.includes(id))}
          onChange={(e) => handleCommentSelection(group.comment_ids, e.target.checked)}
        />
      ),
    },
    {
      title: '댓글 내용',
      dataIndex: 'text_sample',
      key: 'text_sample',
      ellipsis: true,
      render: (text: string) => (
        <Text copyable={{ text }}>
          {text.length > 50 ? `${text.substring(0, 50)}...` : text}
        </Text>
      ),
    },
    {
      title: '중복 개수',
      dataIndex: 'duplicate_count',
      key: 'duplicate_count',
      width: 100,
      render: (count: number) => (
        <Badge count={count} color="red" />
      ),
    },
    {
      title: '작성자 수',
      dataIndex: 'authors',
      key: 'authors',
      width: 100,
      render: (authors: string[]) => (
        <Tag color="blue">{authors.length}명</Tag>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 150,
      render: (group: DuplicateGroup) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showGroupPreview(group)}
          >
            미리보기
          </Button>
          <Button
            size="small"
            type="primary"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleCommentSelection(group.comment_ids, true)}
          >
            선택
          </Button>
        </Space>
      ),
    },
  ];

  // 위험도 계산
  const calculateRiskLevel = useCallback(() => {
    const spamRatio = data.suspicious_count / data.total_comments;
    if (spamRatio > 0.3) return { level: 'high', color: 'red', text: '높음' };
    if (spamRatio > 0.1) return { level: 'medium', color: 'orange', text: '중간' };
    return { level: 'low', color: 'green', text: '낮음' };
  }, [data]);

  const riskLevel = calculateRiskLevel();

  return (
    <div>
      {/* 분석 요약 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Title level={3} style={{ marginBottom: 16 }}>
              📊 분석 요약
            </Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="전체 댓글 수"
                  value={data.total_comments}
                  prefix={<MessageOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="의심 댓글 수"
                  value={data.suspicious_count}
                  prefix={<WarningOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="스팸 비율"
                  value={((data.suspicious_count / data.total_comments) * 100).toFixed(1)}
                  suffix="%"
                  prefix={<ExclamationCircleOutlined />}
                  valueStyle={{ color: riskLevel.color }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="위험도"
                  value={riskLevel.text}
                  prefix={<InfoCircleOutlined />}
                  valueStyle={{ color: riskLevel.color }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 스팸 패턴 분석 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="🔍 스팸 패턴 분석">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="완전 중복"
                    value={data.spam_patterns?.exact_duplicates || 0}
                    prefix={<CheckCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="유사 그룹"
                    value={data.spam_patterns?.similar_groups || 0}
                    prefix={<InfoCircleOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="의심 사용자"
                    value={data.spam_patterns?.suspicious_authors?.length || 0}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="반복 짧은 댓글"
                    value={data.spam_patterns?.short_repetitive || 0}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="이모지 스팸"
                    value={data.spam_patterns?.emoji_spam || 0}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Card size="small">
                  <Statistic
                    title="링크 스팸"
                    value={data.spam_patterns?.link_spam || 0}
                    prefix={<MessageOutlined />}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 선택된 댓글 관리 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Space size="middle" style={{ width: '100%', justifyContent: 'space-between' }}>
              <div>
                <Text strong>선택된 댓글: </Text>
                <Badge count={selectedCommentIds.length} />
                <Divider type="vertical" />
                <Progress
                  percent={Math.round((selectedCommentIds.length / data.suspicious_count) * 100)}
                  size="small"
                  style={{ width: 200 }}
                />
              </div>
              <Space>
                <Button
                  onClick={() => handleSelectAll(true)}
                  disabled={selectedCommentIds.length === data.suspicious_comment_ids.length}
                >
                  전체 선택
                </Button>
                <Button
                  onClick={() => handleSelectAll(false)}
                  disabled={selectedCommentIds.length === 0}
                >
                  전체 해제
                </Button>
                <Button
                  type="primary"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDeleteSelected}
                  disabled={selectedCommentIds.length === 0}
                  loading={loading}
                >
                  선택 삭제 ({selectedCommentIds.length})
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 중복 댓글 그룹 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="🚨 중복 댓글 그룹">
            <Collapse>
              {data.duplicate_groups?.exact_duplicates?.count > 0 && data.duplicate_groups.exact_duplicates.groups?.length > 0 && (
                <Panel
                  header={
                    <Space>
                      <CheckCircleOutlined style={{ color: '#52c41a' }} />
                      <Text strong>완전 중복 댓글 ({data.duplicate_groups.exact_duplicates.count}개 그룹)</Text>
                    </Space>
                  }
                  key="exact"
                >
                  <Table
                    dataSource={data.duplicate_groups.exact_duplicates.groups || []}
                    columns={duplicateGroupColumns}
                    rowKey={(record) => record.comment_ids?.join(',') || Math.random().toString()}
                    pagination={false}
                    size="small"
                  />
                </Panel>
              )}
              
              {data.duplicate_groups?.similar_groups?.count > 0 && data.duplicate_groups.similar_groups.groups?.length > 0 && (
                <Panel
                  header={
                    <Space>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                      <Text strong>유사 댓글 그룹 ({data.duplicate_groups.similar_groups.count}개 그룹)</Text>
                    </Space>
                  }
                  key="similar"
                >
                  <Table
                    dataSource={data.duplicate_groups.similar_groups.groups || []}
                    columns={duplicateGroupColumns}
                    rowKey={(record) => record.comment_ids?.join(',') || Math.random().toString()}
                    pagination={false}
                    size="small"
                  />
                </Panel>
              )}
              
              {(!data.duplicate_groups?.exact_duplicates?.count && !data.duplicate_groups?.similar_groups?.count) && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Text type="secondary">중복 댓글 그룹이 발견되지 않았습니다.</Text>
                </div>
              )}
            </Collapse>
          </Card>
        </Col>
      </Row>

      {/* 의심 사용자 목록 */}
      {data.spam_patterns?.suspicious_authors?.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col span={24}>
            <Card title="👤 의심 사용자">
              <List
                dataSource={data.spam_patterns.suspicious_authors || []}
                renderItem={(author) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={author.author || '알 수 없는 사용자'}
                      description={`${author.count || 0}개의 의심 댓글 작성`}
                    />
                    <Tag color="red">{author.count || 0}개</Tag>
                  </List.Item>
                )}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 미리보기 모달 */}
      <Modal
        title="댓글 그룹 미리보기"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>
            닫기
          </Button>,
          <Button
            key="select"
            type="primary"
            onClick={() => {
              if (previewGroup) {
                handleCommentSelection(previewGroup.comment_ids, true);
              }
              setPreviewModalVisible(false);
            }}
          >
            이 그룹 선택
          </Button>,
        ]}
        width={800}
      >
        {previewGroup && (
          <div>
            <Alert
              message={`댓글 내용: "${previewGroup.text_sample}"`}
              type="info"
              style={{ marginBottom: 16 }}
            />
            <Paragraph>
              <Text strong>중복 개수:</Text> {previewGroup.duplicate_count}개<br />
              <Text strong>작성자 수:</Text> {previewGroup.authors.length}명<br />
              <Text strong>댓글 ID:</Text> {previewGroup.comment_ids.join(', ')}
            </Paragraph>
            <Divider />
            <Text strong>작성자 목록:</Text>
            <div style={{ marginTop: 8 }}>
              {previewGroup.authors.map((author, index) => (
                <Tag key={index} style={{ marginBottom: 4 }}>
                  {author}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* 도움말 */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Alert
            message="댓글 분석 도움말"
            description={
              <div>
                <p>• <strong>완전 중복:</strong> 동일한 텍스트의 댓글들</p>
                <p>• <strong>유사 그룹:</strong> 비슷한 패턴의 댓글들</p>
                <p>• <strong>의심 사용자:</strong> 다수의 스팸 댓글을 작성한 사용자</p>
                <p>• 댓글을 선택한 후 '선택 삭제' 버튼을 클릭하여 일괄 삭제할 수 있습니다</p>
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

export default CommentAnalysisResultComponent;