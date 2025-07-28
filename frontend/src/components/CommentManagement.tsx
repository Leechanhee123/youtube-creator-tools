import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Typography,
  Space,
  Tag,
  Modal,
  message,
  Spin,
  Empty,
  Input,
  Select,
  Popconfirm,
  Alert,
  Checkbox,
  Divider,
  Badge,
  Tooltip,
  Statistic,
} from 'antd';
import {
  MessageOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  BulbOutlined,
  UserOutlined,
  CalendarOutlined,
  HeartOutlined,
  WarningOutlined,
  ClearOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface CommentManagementProps {
  videoId?: string;
  channelId?: string;
}

interface Comment {
  id: string;
  author: string;
  author_channel_id: string;
  text: string;
  like_count: number;
  reply_count: number;
  published_at: string;
  updated_at: string;
  video_id: string;
  replies: Comment[];
  snippet: any;
}

interface SpamComment {
  comment_id: string;
  author: string;
  text: string;
  spam_score: number;
  detected_keywords: string[];
  published_at: string;
}

const CommentManagement: React.FC<CommentManagementProps> = ({
  videoId,
  channelId
}) => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [spamComments, setSpamComments] = useState<SpamComment[]>([]);
  const [selectedComments, setSelectedComments] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [spamDetectionLoading, setSpamDetectionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('comments');

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  const fetchComments = async () => {
    if (!accessToken) return;
    
    setLoading(true);
    try {
      let url = '';
      if (videoId) {
        url = `${API_BASE_URL}/api/v1/auth/comments/video/${videoId}`;
      } else if (channelId) {
        url = `${API_BASE_URL}/api/v1/auth/comments/channel/${channelId}`;
      } else {
        message.error('비디오 ID 또는 채널 ID가 필요합니다.');
        return;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setComments(result.data.comments);
          message.success(result.message);
        } else {
          message.error(result.message);
        }
      } else {
        message.error('댓글 조회에 실패했습니다.');
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
      message.error('댓글 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const detectSpamComments = async () => {
    if (!videoId || !accessToken) return;
    
    setSpamDetectionLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/comments/spam-detection/${videoId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSpamComments(result.data.spam_comments);
          message.success(`스팸 댓글 ${result.data.spam_count}개를 탐지했습니다.`);
        } else {
          message.error(result.message);
        }
      } else {
        message.error('스팸 댓글 탐지에 실패했습니다.');
      }
    } catch (error) {
      console.error('Spam detection error:', error);
      message.error('스팸 댓글 탐지 중 오류가 발생했습니다.');
    } finally {
      setSpamDetectionLoading(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!accessToken) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success('댓글이 성공적으로 삭제되었습니다.');
          fetchComments(); // 목록 새로고침
        } else {
          message.error(result.message);
        }
      } else {
        message.error('댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Comment delete error:', error);
      message.error('댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteMultipleComments = async (commentIds: string[]) => {
    if (!accessToken || !commentIds.length) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/comments/delete-multiple`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ comment_ids: commentIds })
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success(result.message);
          setSelectedComments([]);
          fetchComments(); // 목록 새로고침
        } else {
          message.error(result.message);
        }
      } else {
        message.error('일괄 댓글 삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Multiple comments delete error:', error);
      message.error('일괄 댓글 삭제 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const cleanupSpamComments = async () => {
    if (!videoId || !accessToken) return;
    
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/auth/comments/spam-cleanup/${videoId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          message.success(result.message);
          fetchComments(); // 목록 새로고침
          detectSpamComments(); // 스팸 목록 새로고침
        } else {
          message.error(result.message);
        }
      } else {
        message.error('스팸 댓글 정리에 실패했습니다.');
      }
    } catch (error) {
      console.error('Spam cleanup error:', error);
      message.error('스팸 댓글 정리 중 오류가 발생했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken && (videoId || channelId)) {
      fetchComments();
      if (videoId) {
        detectSpamComments();
      }
    }
  }, [accessToken, videoId, channelId]);

  const filteredComments = comments.filter(comment => {
    const matchesSearch = comment.text.toLowerCase().includes(searchText.toLowerCase()) ||
                         comment.author.toLowerCase().includes(searchText.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'with_replies') return matchesSearch && comment.reply_count > 0;
    if (filterType === 'popular') return matchesSearch && comment.like_count > 0;
    
    return matchesSearch;
  });

  const commentColumns: ColumnsType<Comment> = [
    {
      title: '선택',
      key: 'select',
      width: 50,
      render: (_, record) => (
        <Checkbox
          checked={selectedComments.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedComments([...selectedComments, record.id]);
            } else {
              setSelectedComments(selectedComments.filter(id => id !== record.id));
            }
          }}
        />
      ),
    },
    {
      title: '작성자',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{author}</Text>
        </Space>
      ),
    },
    {
      title: '댓글 내용',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '좋아요',
      dataIndex: 'like_count',
      key: 'like_count',
      width: 80,
      sorter: (a, b) => a.like_count - b.like_count,
      render: (count: number) => (
        <Space>
          <HeartOutlined style={{ color: count > 0 ? '#f5222d' : '#ccc' }} />
          <Text>{count}</Text>
        </Space>
      ),
    },
    {
      title: '답글',
      dataIndex: 'reply_count',
      key: 'reply_count',
      width: 80,
      sorter: (a, b) => a.reply_count - b.reply_count,
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      ),
    },
    {
      title: '작성일',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 120,
      sorter: (a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime(),
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString()}</Text>
        </Space>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="댓글을 삭제하시겠습니까?"
          onConfirm={() => deleteComment(record.id)}
          okText="삭제"
          cancelText="취소"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deleteLoading}
          />
        </Popconfirm>
      ),
    },
  ];

  const spamColumns: ColumnsType<SpamComment> = [
    {
      title: '작성자',
      dataIndex: 'author',
      key: 'author',
      width: 150,
      render: (author: string) => (
        <Space>
          <UserOutlined />
          <Text strong>{author}</Text>
        </Space>
      ),
    },
    {
      title: '댓글 내용',
      dataIndex: 'text',
      key: 'text',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <Text>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: '스팸 점수',
      dataIndex: 'spam_score',
      key: 'spam_score',
      width: 100,
      sorter: (a, b) => a.spam_score - b.spam_score,
      render: (score: number) => (
        <Badge
          count={score}
          style={{
            backgroundColor: score >= 3 ? '#f5222d' : score >= 2 ? '#fa8c16' : '#52c41a'
          }}
        />
      ),
    },
    {
      title: '탐지된 키워드',
      dataIndex: 'detected_keywords',
      key: 'detected_keywords',
      render: (keywords: string[]) => (
        <Space wrap>
          {keywords.map(keyword => (
            <Tag key={keyword} color="red" size="small">
              {keyword}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '작성일',
      dataIndex: 'published_at',
      key: 'published_at',
      width: 120,
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{new Date(date).toLocaleDateString()}</Text>
        </Space>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="스팸 댓글을 삭제하시겠습니까?"
          onConfirm={() => deleteComment(record.comment_id)}
          okText="삭제"
          cancelText="취소"
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            loading={deleteLoading}
          />
        </Popconfirm>
      ),
    },
  ];

  if (!accessToken) {
    return (
      <Card>
        <Alert
          message="로그인이 필요합니다"
          description="댓글 관리 기능을 사용하려면 먼저 로그인해주세요."
          type="warning"
          showIcon
        />
      </Card>
    );
  }

  return (
    <div>
      <Card
        title={
          <Space>
            <MessageOutlined />
            <Title level={4} style={{ margin: 0 }}>
              댓글 관리
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchComments}
              loading={loading}
            >
              새로고침
            </Button>
            {videoId && (
              <Button
                icon={<BulbOutlined />}
                onClick={detectSpamComments}
                loading={spamDetectionLoading}
              >
                스팸 탐지
              </Button>
            )}
          </Space>
        }
      >
        {/* 통계 정보 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title="전체 댓글"
              value={comments.length}
              prefix={<MessageOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="스팸 댓글"
              value={spamComments.length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="선택된 댓글"
              value={selectedComments.length}
              prefix={<ExclamationCircleOutlined />}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="답글 있는 댓글"
              value={comments.filter(c => c.reply_count > 0).length}
              prefix={<MessageOutlined />}
            />
          </Col>
        </Row>

        {/* 필터 및 검색 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Search
              placeholder="댓글 내용 또는 작성자 검색"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
            />
          </Col>
          <Col span={6}>
            <Select
              value={filterType}
              onChange={setFilterType}
              style={{ width: '100%' }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">전체 댓글</Option>
              <Option value="with_replies">답글 있는 댓글</Option>
              <Option value="popular">인기 댓글</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Button
                danger
                disabled={selectedComments.length === 0}
                loading={deleteLoading}
                onClick={() => {
                  Modal.confirm({
                    title: '선택된 댓글을 삭제하시겠습니까?',
                    content: `${selectedComments.length}개의 댓글이 영구적으로 삭제됩니다.`,
                    okText: '삭제',
                    cancelText: '취소',
                    onOk: () => deleteMultipleComments(selectedComments),
                  });
                }}
              >
                선택 삭제 ({selectedComments.length})
              </Button>
              {videoId && spamComments.length > 0 && (
                <Button
                  type="primary"
                  danger
                  icon={<ClearOutlined />}
                  loading={deleteLoading}
                  onClick={() => {
                    Modal.confirm({
                      title: '스팸 댓글을 모두 삭제하시겠습니까?',
                      content: `${spamComments.length}개의 스팸 댓글이 영구적으로 삭제됩니다.`,
                      okText: '삭제',
                      cancelText: '취소',
                      onOk: cleanupSpamComments,
                    });
                  }}
                >
                  스팸 정리 ({spamComments.length})
                </Button>
              )}
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* 댓글 목록 탭 */}
        <div style={{ marginBottom: 16 }}>
          <Button.Group>
            <Button
              type={activeTab === 'comments' ? 'primary' : 'default'}
              onClick={() => setActiveTab('comments')}
            >
              전체 댓글 ({filteredComments.length})
            </Button>
            <Button
              type={activeTab === 'spam' ? 'primary' : 'default'}
              onClick={() => setActiveTab('spam')}
            >
              스팸 댓글 ({spamComments.length})
            </Button>
          </Button.Group>
        </div>

        {/* 댓글 테이블 */}
        {activeTab === 'comments' ? (
          <Table
            dataSource={filteredComments}
            columns={commentColumns}
            loading={loading}
            rowKey="id"
            pagination={{
              total: filteredComments.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total}개`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="댓글이 없습니다"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        ) : (
          <Table
            dataSource={spamComments}
            columns={spamColumns}
            loading={spamDetectionLoading}
            rowKey="comment_id"
            pagination={{
              total: spamComments.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} / ${total}개`,
            }}
            locale={{
              emptyText: (
                <Empty
                  description="스팸 댓글이 없습니다"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ),
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default CommentManagement;