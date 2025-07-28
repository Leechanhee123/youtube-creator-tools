/**
 * OAuth 콜백 처리 페이지
 */

import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Spin, Result, Typography } from 'antd';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleAuthCallback, isAuthenticated } = useAuth();
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processCallback = async () => {
      // 이미 처리했다면 return
      if (hasProcessed.current) {
        return;
      }
      
      hasProcessed.current = true;
      
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        console.log('OAuth 콜백 파라미터:', { code: code?.substring(0, 20) + '...', state, error });

        // OAuth 에러 확인
        if (error) {
          throw new Error(`OAuth 인증 취소: ${error}`);
        }

        // 필수 파라미터 확인
        if (!code || !state) {
          throw new Error('잘못된 OAuth 콜백 파라미터입니다.');
        }

        console.log('handleAuthCallback 호출 시작...');
        
        // 인증 처리
        await handleAuthCallback(code, state);
        
        console.log('handleAuthCallback 완료!');
        
        // 성공 시 대시보드로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);

      } catch (error: any) {
        console.error('OAuth 콜백 처리 실패:', error);
        setError(error.message);
        setProcessing(false);
        
        // 에러 시 3초 후 홈페이지로 리다이렉트
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    processCallback();
  }, []);

  // 인증 성공 후 리다이렉트 처리
  useEffect(() => {
    if (isAuthenticated && processing) {
      setProcessing(false);
    }
  }, [isAuthenticated, processing]);

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <Result
          status="error"
          title="인증 실패"
          subTitle={error}
          extra={
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                3초 후 홈페이지로 이동합니다...
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  if (isAuthenticated && !processing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        padding: '20px'
      }}>
        <Result
          status="success"
          title="로그인 성공!"
          subTitle="YouTube Creator Tools에 오신 것을 환영합니다."
          extra={
            <div style={{ textAlign: 'center' }}>
              <Text type="secondary">
                잠시 후 대시보드로 이동합니다...
              </Text>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <Spin size="large" />
      <div style={{ marginTop: 24, textAlign: 'center' }}>
        <Text style={{ fontSize: '18px', fontWeight: 500 }}>
          로그인 처리 중...
        </Text>
        <br />
        <Text type="secondary">
          Google 계정 인증을 처리하고 있습니다.
        </Text>
      </div>
    </div>
  );
};

export default AuthCallback;