import React from 'react';
import { Card, Table, Button, Typography, Avatar, Spin } from 'antd';
import { PlayCircleOutlined, EyeOutlined, CommentOutlined } from '@ant-design/icons';
import type { VideoInfo } from '../../../types/api';

const { Text } = Typography;

interface VideosTabProps {
  selectedChannelId: string | null;
  videos: VideoInfo[];
  videosLoading: boolean;
  totalResults: number;
  onVideoAnalysis: (videoUrl: string) => void;
}

const VideosTab: React.FC<VideosTabProps> = ({
  selectedChannelId,
  videos,
  videosLoading,
  totalResults,
  onVideoAnalysis
}) => {
  const videoColumns = [
    {
      title: '썸네일',
      dataIndex: 'thumbnails',
      key: 'thumbnail',
      width: 120,
      render: (thumbnails: VideoInfo['thumbnails']) => (
        <Avatar 
          src={thumbnails?.medium?.url || thumbnails?.default?.url} 
          size={60} 
          shape="square"
          icon={<PlayCircleOutlined />}
        />
      ),
    },
    {
      title: '제목',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (title: string, record: VideoInfo) => (
        <div>
          <Text strong>{title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {new Date(record.published_at).toLocaleDateString('ko-KR')}
          </Text>
        </div>
      ),
    },
    {
      title: '통계',
      key: 'statistics',
      width: 150,
      render: (record: VideoInfo) => (
        <div>
          {record.statistics && (
            <>
              <div style={{ fontSize: '12px' }}>
                <EyeOutlined /> {record.statistics.view_count?.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '12px' }}>
                <CommentOutlined /> {record.statistics.comment_count?.toLocaleString() || 0}
              </div>
            </>
          )}
        </div>
      ),
    },
    {
      title: '작업',
      key: 'actions',
      width: 120,
      render: (record: VideoInfo) => (
        <Button
          type="primary"
          size="small"
          onClick={() => onVideoAnalysis(record.video_url)}
        >
          댓글 분석
        </Button>
      ),
    },
  ];

  if (!selectedChannelId) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Text type="secondary">
          먼저 채널을 분석해주세요
        </Text>
      </div>
    );
  }

  return (
    <Spin spinning={videosLoading}>
      <Card title={`비디오 목록 (총 ${totalResults}개)`}>
        <Table
          dataSource={videos}
          columns={videoColumns}
          rowKey="video_id"
          pagination={{
            total: totalResults,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} 비디오`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>
    </Spin>
  );
};

export default VideosTab;