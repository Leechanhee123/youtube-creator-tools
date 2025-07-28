import React from 'react';
import { 
  Layout, 
  Button, 
  Space, 
  Dropdown, 
  Avatar, 
  Typography,
  Switch,
  Tooltip
} from 'antd';
import { 
  BulbOutlined, 
  BulbFilled,
  GlobalOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, type Language } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const { Header } = Layout;
const { Title } = Typography;

const AppHeader: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, user, logout, login } = useAuth();

  // 언어 선택 메뉴
  const languageItems = [
    {
      key: 'ko',
      label: (
        <Space>
          <span>🇰🇷</span>
          <span>한국어</span>
        </Space>
      ),
      onClick: () => setLanguage('ko' as Language),
    },
    {
      key: 'en',
      label: (
        <Space>
          <span>🇺🇸</span>
          <span>English</span>
        </Space>
      ),
      onClick: () => setLanguage('en' as Language),
    },
    {
      key: 'ja',
      label: (
        <Space>
          <span>🇯🇵</span>
          <span>日本語</span>
        </Space>
      ),
      onClick: () => setLanguage('ja' as Language),
    },
  ];

  // 사용자 메뉴
  const userItems = isAuthenticated ? [
    {
      key: 'settings',
      label: (
        <Space>
          <SettingOutlined />
          <span>설정</span>
        </Space>
      ),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          <span>{t('common.logout')}</span>
        </Space>
      ),
      onClick: logout,
    },
  ] : [
    {
      key: 'login',
      label: (
        <Space>
          <UserOutlined />
          <span>{t('common.login')}</span>
        </Space>
      ),
      onClick: () => {
        login();
      },
    },
  ];

  const getCurrentLanguageFlag = () => {
    switch (language) {
      case 'ko': return '🇰🇷';
      case 'ja': return '🇯🇵';
      default: return '🇺🇸';
    }
  };

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        width: '100vw',
        height: '64px',
        lineHeight: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: isDarkMode ? '#001529' : '#ffffff',
        borderBottom: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.3s ease',
        margin: 0,
      }}
    >
      {/* 로고 */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Title 
          level={3} 
          style={{ 
            margin: 0, 
            color: isDarkMode ? '#ffffff' : '#1890ff',
            background: 'linear-gradient(45deg, #1890ff, #722ed1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold',
          }}
        >
          🎬 {t('dashboard.title')}
        </Title>
      </div>

      {/* 우측 컨트롤 */}
      <Space size="large">
        {/* 테마 토글 */}
        <Tooltip title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BulbOutlined style={{ color: isDarkMode ? '#faad14' : '#8c8c8c' }} />
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              checkedChildren={<BulbFilled />}
              unCheckedChildren={<BulbOutlined />}
              style={{
                backgroundColor: isDarkMode ? '#722ed1' : '#d9d9d9',
              }}
            />
          </div>
        </Tooltip>

        {/* 언어 선택 */}
        <Dropdown
          menu={{ items: languageItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button 
            type="text" 
            icon={<GlobalOutlined />}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              color: isDarkMode ? '#ffffff' : '#000000',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
          >
            <span>{getCurrentLanguageFlag()}</span>
          </Button>
        </Dropdown>

        {/* 사용자 메뉴 */}
        <Dropdown
          menu={{ items: userItems }}
          placement="bottomRight"
          trigger={['click']}
        >
          <Button 
            type="text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: isDarkMode ? '#ffffff' : '#000000',
              border: 'none',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.3s ease',
            }}
          >
            <Avatar 
              size="small" 
              src={user?.picture} 
              icon={<UserOutlined />}
              style={{
                backgroundColor: isAuthenticated ? '#1890ff' : '#d9d9d9',
              }}
            />
            {isAuthenticated && user?.name && (
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </span>
            )}
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
};

export default AppHeader;