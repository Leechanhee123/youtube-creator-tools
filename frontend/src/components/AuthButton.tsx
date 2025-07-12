/**
 * 인증 버튼 컴포넌트 (로그인/로그아웃)
 */

import React from 'react';
import { Button, Avatar, Dropdown, Space, Typography } from 'antd';
import { 
  LoginOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  YoutubeOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Text } = Typography;

interface AuthButtonProps {
  size?: 'small' | 'middle' | 'large';
  style?: React.CSSProperties;
}

const AuthButton: React.FC<AuthButtonProps> = ({ size = 'middle', style }) => {
  const { isAuthenticated, user, channels, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <Button loading size={size} style={style}>
        로딩중...
      </Button>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        type="primary"
        icon={<LoginOutlined />}
        onClick={login}
        size={size}
        style={style}
      >
        YouTube 로그인
      </Button>
    );
  }

  // 로그인된 상태
  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: (
        <div>
          <Text strong>{user?.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {user?.email}
          </Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    ...(channels && channels.length > 0 ? [
      {
        key: 'channels',
        icon: <YoutubeOutlined />,
        label: (
          <div>
            <Text>보유 채널</Text>
            {channels.map((channel) => (
              <div key={channel.channel_id} style={{ marginLeft: 16, marginTop: 4 }}>
                <Text style={{ fontSize: '12px' }}>{channel.title}</Text>
              </div>
            ))}
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider',
      },
    ] : []),
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '로그아웃',
      onClick: logout,
    },
  ];

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button style={style} size={size}>
        <Space>
          <Avatar 
            size={size === 'large' ? 32 : size === 'small' ? 20 : 24}
            src={user?.picture} 
            icon={<UserOutlined />}
          />
          <span>{user?.name}</span>
        </Space>
      </Button>
    </Dropdown>
  );
};

export default AuthButton;