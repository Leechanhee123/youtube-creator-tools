import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from 'antd';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import AppHeader from './components/AppHeader';
import './App.css';
import './styles/global.css';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const { Content } = Layout;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <Router>
              <Layout className="full-screen-layout">
                <AppHeader />
                
                <Content className="full-screen-content">
                  <div className="fade-in full-width-container">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/auth/callback" element={<AuthCallback />} />
                    </Routes>
                  </div>
                </Content>
              </Layout>
            </Router>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App
