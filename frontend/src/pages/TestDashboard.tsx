import React from 'react';
import { Typography, Card } from 'antd';

const { Title } = Typography;

const TestDashboard: React.FC = () => {
  return (
    <div>
      <Card>
        <Title level={2}>YouTube Creator Tools - 테스트</Title>
        <p>프론트엔드가 정상적으로 실행되고 있습니다!</p>
      </Card>
    </div>
  );
};

export default TestDashboard;