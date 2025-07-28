// Google AdSense 통합을 위한 유틸리티 함수들

// AdSense 스크립트 로드
export const loadAdSenseScript = (clientId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우 건너뛰기
    if (document.querySelector('script[src*="adsbygoogle.js"]')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('AdSense script loading failed'));
    
    document.head.appendChild(script);
  });
};

// AdSense 광고 초기화
export const initializeAd = (adElement: HTMLElement) => {
  try {
    // @ts-ignore - adsbygoogle는 외부 스크립트에서 제공됨
    if (window.adsbygoogle) {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  } catch (error) {
    console.error('AdSense initialization failed:', error);
  }
};

// 광고 크기별 설정
export const adSizeConfigs = {
  banner: {
    'data-ad-format': 'auto',
    'data-full-width-responsive': 'true',
    style: { display: 'block', width: '728px', height: '90px' }
  },
  rectangle: {
    'data-ad-format': 'rectangle',
    'data-full-width-responsive': 'true',
    style: { display: 'inline-block', width: '300px', height: '250px' }
  },
  sidebar: {
    'data-ad-format': 'auto',
    'data-full-width-responsive': 'true',
    style: { display: 'block', width: '300px', height: '600px' }
  },
  mobile: {
    'data-ad-format': 'auto',
    'data-full-width-responsive': 'true',
    style: { display: 'block', width: '320px', height: '50px' }
  }
};

// 환경별 AdSense 클라이언트 ID
export const getAdSenseClientId = (): string => {
  // 프로덕션 환경에서는 실제 클라이언트 ID 사용
  const production = import.meta.env.VITE_ADSENSE_CLIENT_ID;
  
  // 개발 환경에서는 테스트 클라이언트 ID 또는 비활성화
  const development = 'ca-pub-test'; // 테스트용
  
  return import.meta.env.PROD ? production || development : development;
};

// 광고 슬롯 ID 관리
export const adSlotIds = {
  banner: import.meta.env.VITE_ADSENSE_BANNER_SLOT || '1234567890',
  rectangle: import.meta.env.VITE_ADSENSE_RECTANGLE_SLOT || '1234567891',
  sidebar: import.meta.env.VITE_ADSENSE_SIDEBAR_SLOT || '1234567892',
  mobile: import.meta.env.VITE_ADSENSE_MOBILE_SLOT || '1234567893'
};

// 광고 차단기 감지
export const detectAdBlocker = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // 테스트용 광고 요소 생성
    const testAd = document.createElement('div');
    testAd.innerHTML = '&nbsp;';
    testAd.className = 'adsbox';
    testAd.style.position = 'absolute';
    testAd.style.left = '-10000px';
    testAd.style.width = '1px';
    testAd.style.height = '1px';
    
    document.body.appendChild(testAd);
    
    setTimeout(() => {
      const isBlocked = testAd.offsetHeight === 0;
      document.body.removeChild(testAd);
      resolve(isBlocked);
    }, 100);
  });
};

// 광고 로드 상태 추적
export const trackAdLoadStatus = (adId: string, callback: (loaded: boolean) => void) => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const adElement = document.getElementById(adId);
        if (adElement && adElement.children.length > 0) {
          callback(true);
          observer.disconnect();
        }
      }
    });
  });

  const adElement = document.getElementById(adId);
  if (adElement) {
    observer.observe(adElement, { childList: true, subtree: true });
    
    // 5초 후 타임아웃
    setTimeout(() => {
      observer.disconnect();
      callback(false);
    }, 5000);
  }
};