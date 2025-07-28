import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ko' | 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// 번역 데이터
const translations = {
  ko: {
    // 네비게이션
    'nav.dashboard': '대시보드',
    'nav.videos': '비디오 목록',
    'nav.analysis': '댓글 분석',
    'nav.seo': 'SEO 분석',
    'nav.competitor': '경쟁사 분석',
    'nav.management': '채널 관리',
    
    // 공통
    'common.loading': '로딩 중...',
    'common.error': '오류',
    'common.success': '성공',
    'common.cancel': '취소',
    'common.confirm': '확인',
    'common.save': '저장',
    'common.delete': '삭제',
    'common.edit': '편집',
    'common.search': '검색',
    'common.refresh': '새로고침',
    'common.login': '로그인',
    'common.logout': '로그아웃',
    
    // 대시보드
    'dashboard.title': 'YouTube Creator Tools',
    'dashboard.channelUrl': '채널 URL 입력',
    'dashboard.analyze': '분석 시작',
    'dashboard.reset': '초기화',
    
    // 채널 관리
    'management.title': '채널 관리',
    'management.welcome': '안녕하세요, {name}님',
    'management.subtitle': '채널 관리 대시보드',
    'management.myChannels': '내 채널 목록',
    'management.revenue': '수익 분석',
    'management.analytics': '채널 분석',
    'management.commentManagement': '댓글 관리',
    'management.loginRequired': '이 기능을 사용하려면 Google 계정으로 로그인해주세요.',
    'management.loginDescription': '로그인 후 내 채널의 수익 데이터, 분석 정보를 확인하고 댓글을 직접 관리할 수 있습니다.',
    
    // 통계
    'stats.totalRevenue': '총 수익',
    'stats.adRevenue': '광고 수익',
    'stats.dailyRevenue': '일평균 수익',
    'stats.grossRevenue': '총 매출',
    'stats.totalViews': '총 조회수',
    'stats.watchTime': '시청 시간',
    'stats.subscribers': '구독자 순증가',
    'stats.dailyViews': '일평균 조회수',
    
    // 메시지
    'message.channelAnalysisComplete': '채널 분석 완료',
    'message.channelAnalysisFailed': '채널 분석 실패',
    'message.commentAnalysisComplete': '댓글 분석 완료',
    'message.loginWithGoogle': 'Google 계정으로 로그인',
  },
  
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.videos': 'Videos',
    'nav.analysis': 'Comment Analysis',
    'nav.seo': 'SEO Analysis',
    'nav.competitor': 'Competitor Analysis',
    'nav.management': 'Channel Management',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.search': 'Search',
    'common.refresh': 'Refresh',
    'common.login': 'Login',
    'common.logout': 'Logout',
    
    // Dashboard
    'dashboard.title': 'YouTube Creator Tools',
    'dashboard.channelUrl': 'Enter Channel URL',
    'dashboard.analyze': 'Start Analysis',
    'dashboard.reset': 'Reset',
    
    // Channel Management
    'management.title': 'Channel Management',
    'management.welcome': 'Hello, {name}',
    'management.subtitle': 'Channel Management Dashboard',
    'management.myChannels': 'My Channels',
    'management.revenue': 'Revenue Analysis',
    'management.analytics': 'Channel Analytics',
    'management.commentManagement': 'Comment Management',
    'management.loginRequired': 'Please login with your Google account to use this feature.',
    'management.loginDescription': 'After logging in, you can view revenue data, analytics, and manage comments directly.',
    
    // Statistics
    'stats.totalRevenue': 'Total Revenue',
    'stats.adRevenue': 'Ad Revenue',
    'stats.dailyRevenue': 'Daily Avg Revenue',
    'stats.grossRevenue': 'Gross Revenue',
    'stats.totalViews': 'Total Views',
    'stats.watchTime': 'Watch Time',
    'stats.subscribers': 'Net Subscribers',
    'stats.dailyViews': 'Daily Avg Views',
    
    // Messages
    'message.channelAnalysisComplete': 'Channel analysis completed',
    'message.channelAnalysisFailed': 'Channel analysis failed',
    'message.commentAnalysisComplete': 'Comment analysis completed',
    'message.loginWithGoogle': 'Login with Google',
  },
  
  ja: {
    // ナビゲーション
    'nav.dashboard': 'ダッシュボード',
    'nav.videos': '動画一覧',
    'nav.analysis': 'コメント分析',
    'nav.seo': 'SEO分析',
    'nav.competitor': '競合分析',
    'nav.management': 'チャンネル管理',
    
    // 共通
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.save': '保存',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.search': '検索',
    'common.refresh': '更新',
    'common.login': 'ログイン',
    'common.logout': 'ログアウト',
    
    // ダッシュボード
    'dashboard.title': 'YouTube Creator Tools',
    'dashboard.channelUrl': 'チャンネルURLを入力',
    'dashboard.analyze': '分析開始',
    'dashboard.reset': 'リセット',
    
    // チャンネル管理
    'management.title': 'チャンネル管理',
    'management.welcome': 'こんにちは、{name}さん',
    'management.subtitle': 'チャンネル管理ダッシュボード',
    'management.myChannels': 'マイチャンネル',
    'management.revenue': '収益分析',
    'management.analytics': 'チャンネル分析',
    'management.commentManagement': 'コメント管理',
    'management.loginRequired': 'この機能を使用するにはGoogleアカウントでログインしてください。',
    'management.loginDescription': 'ログイン後、チャンネルの収益データ、分析情報を確認し、コメントを直接管理できます。',
    
    // 統計
    'stats.totalRevenue': '総収益',
    'stats.adRevenue': '広告収益',
    'stats.dailyRevenue': '1日平均収益',
    'stats.grossRevenue': '総売上',
    'stats.totalViews': '総再生回数',
    'stats.watchTime': '視聴時間',
    'stats.subscribers': '登録者純増',
    'stats.dailyViews': '1日平均再生回数',
    
    // メッセージ
    'message.channelAnalysisComplete': 'チャンネル分析完了',
    'message.channelAnalysisFailed': 'チャンネル分析失敗',
    'message.commentAnalysisComplete': 'コメント分析完了',
    'message.loginWithGoogle': 'Googleでログイン',
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // 로컬 스토리지에서 언어 설정 불러오기
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['ko', 'en', 'ja'].includes(savedLang)) {
      return savedLang;
    }
    
    // 브라우저 언어 감지
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) return 'ko';
    if (browserLang.startsWith('ja')) return 'ja';
    return 'en'; // 기본값
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  // 번역 함수
  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language][key] || translations.en[key] || key;
    
    // 매개변수 치환
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  };

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};