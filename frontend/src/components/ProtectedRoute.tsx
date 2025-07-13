/**
 * 인증이 필요한 페이지를 보호하는 컴포넌트
 */

import React from 'react';
import { Result, Button, Spin } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback,
  requireAuth = true 
}) => {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px'
      }}>
        <Spin size="large" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <Result
        status="403"
        title="로그인이 필요합니다"
        subTitle="YouTube Creator Tools의 모든 기능을 사용하려면 Google 계정으로 로그인해주세요."
        extra={
          <Button 
            type="primary" 
            icon={<LoginOutlined />}
            size="large"
            onClick={login}
          >
            YouTube 로그인
          </Button>
        }
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;