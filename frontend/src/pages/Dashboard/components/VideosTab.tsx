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
        <div style={{ fontSize: '12px' }}>
          {record.statistics ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <EyeOutlined style={{ color: '#1890ff', marginRight: '4px' }} />
                <span>{record.statistics.view_count.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <CommentOutlined style={{ color: '#52c41a', marginRight: '4px' }} />
                <span>{record.statistics.comment_count.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ color: '#f5222d', marginRight: '4px' }}>❤</span>
                <span>{record.statistics.like_count.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div style={{ color: '#999' }}>통계 정보 없음</div>
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
      <div className="full-width-container" style={{ textAlign: 'center', padding: '50px 0', minHeight: '100vh' }}>
        <Text type="secondary">
          먼저 채널을 분석해주세요
        </Text>
      </div>
    );
  }

  return (
    <div className="full-width-container">
      <div className="layout-with-ads">
        <div className="main-content">
          <Spin spinning={videosLoading}>

            <Card title={`비디오 목록 (총 ${totalResults}개)`} className="modern-card">
              <Table
                dataSource={videos}
                columns={videoColumns}
                rowKey="video_id"
                pagination={{
                  total: videos.length,
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} 비디오 (전체 ${totalResults}개 중 최신 ${videos.length}개)`,
                }}
                scroll={{ x: 800 }}
              />
            </Card>

          </Spin>
        </div>
        
        {/* 사이드바 광고 */}
        <div className="sidebar-ads">
          <div className="ad-container ad-sidebar">
            <div className="ad-placeholder">
              <div style={{ fontSize: '24px', opacity: 0.5 }}>📋</div>
              <div style={{ fontSize: '12px', color: '#999' }}>Google AdSense</div>
              <div style={{ fontSize: '11px', color: '#666' }}>300x600 - 사이드바</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideosTab;