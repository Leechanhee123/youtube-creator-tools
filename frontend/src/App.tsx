import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Layout, theme } from 'antd';
import koKR from 'antd/locale/ko_KR';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import AuthButton from './components/AuthButton';
import './App.css';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const { Header, Content } = Layout;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={koKR}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#ff4d4f',
            borderRadius: 6,
          },
        }}
      >
        <AuthProvider>
          <Router>
            <Layout style={{ minHeight: '100vh' }}>
              <Header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff',
                borderBottom: '1px solid #f0f0f0',
                padding: '0 24px'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#ff4d4f'
                }}>
                  🎬 YouTube Creator Tools
                </div>
                <AuthButton />
              </Header>
              
              <Content style={{ padding: '24px' }}>
                <div style={{ 
                  background: '#fff', 
                  padding: '24px', 
                  borderRadius: '8px',
                  minHeight: 'calc(100vh - 112px)'
                }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                  </Routes>
                </div>
              </Content>
            </Layout>
          </Router>
        </AuthProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App
