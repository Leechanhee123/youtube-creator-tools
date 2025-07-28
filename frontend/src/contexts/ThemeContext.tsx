import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // 로컬 스토리지에서 테마 설정 불러오기
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 시스템 테마 설정 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newTheme = !prev;
      localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      return newTheme;
    });
  };

  // 시스템 테마 변경 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setIsDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Ant Design 테마 설정
  const antdTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
  };

  const themeValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light',
  };

  return (
    <ThemeContext.Provider value={themeValue}>
      <ConfigProvider theme={antdTheme}>
        <div 
          className={`theme-wrapper ${isDarkMode ? 'dark' : 'light'}`}
          style={{
            minHeight: '100vh',
            backgroundColor: isDarkMode ? '#141414' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            transition: 'background-color 0.3s ease, color 0.3s ease',
          }}
        >
          {children}
        </div>
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};