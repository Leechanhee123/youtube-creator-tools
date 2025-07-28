import React, { useEffect, useRef, useState } from 'react';
import { Typography } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { getAdSenseClientId, adSlotIds, adSizeConfigs, initializeAd, detectAdBlocker } from '../utils/adsense';

const { Text } = Typography;

interface AdBannerProps {
  type?: 'banner' | 'rectangle' | 'sidebar' | 'mobile';
  className?: string;
  style?: React.CSSProperties;
  enableProduction?: boolean; // 프로덕션에서만 실제 광고 표시
}

const AdBanner: React.FC<AdBannerProps> = ({ 
  type = 'banner', 
  className = '',
  style = {},
  enableProduction = false
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const [adBlocked, setAdBlocked] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [isProduction] = useState(import.meta.env.PROD);

  const getAdInfo = () => {
    switch (type) {
      case 'banner':
        return { width: '728x90', description: '배너 광고', emoji: '📢' };
      case 'rectangle':
        return { width: '300x250', description: '중간 직사각형 광고', emoji: '📱' };
      case 'sidebar':
        return { width: '300x600', description: '사이드바 광고', emoji: '📋' };
      case 'mobile':
        return { width: '320x50', description: '모바일 배너 광고', emoji: '📱' };
      default:
        return { width: '728x90', description: '광고', emoji: '📢' };
    }
  };

  const adInfo = getAdInfo();
  const clientId = getAdSenseClientId();
  const slotId = adSlotIds[type as keyof typeof adSlotIds];
  const adConfig = adSizeConfigs[type as keyof typeof adSizeConfigs];

  useEffect(() => {
    // 광고 차단기 감지
    detectAdBlocker().then(setAdBlocked);

    // 프로덕션 환경이고 enableProduction이 true일 때만 실제 광고 로드
    if (isProduction && enableProduction && !adBlocked) {
      initializeAd(adRef.current!);
      setAdLoaded(true);
    }
  }, [isProduction, enableProduction, adBlocked]);

  // 개발 환경이거나 광고가 차단된 경우 플레이스홀더 표시
  if (!isProduction || !enableProduction || adBlocked || !adLoaded) {
    return (
      <div 
        className={`ad-container ad-${type} ${className}`}
        style={style}
        ref={adRef}
      >
        <div className="ad-placeholder">
          {adBlocked ? (
            <>
              <ExclamationCircleOutlined style={{ fontSize: '20px', opacity: 0.5 }} />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                광고 차단기 감지됨
              </Text>
            </>
          ) : (
            <>
              <div style={{ fontSize: '20px', opacity: 0.5 }}>{adInfo.emoji}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Google AdSense
              </Text>
              <Text type="secondary" style={{ fontSize: '11px', opacity: 0.7 }}>
                {adInfo.width} - {adInfo.description}
              </Text>
              {!isProduction && (
                <Text type="secondary" style={{ fontSize: '10px', opacity: 0.5 }}>
                  (개발 모드)
                </Text>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // 프로덕션 환경에서 실제 광고 표시
  return (
    <div 
      className={`ad-container ad-${type} ${className}`}
      style={style}
      ref={adRef}
    >
      <ins 
        className="adsbygoogle"
        style={{ display: 'block', ...adConfig.style }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        {...adConfig}
      />
    </div>
  );
};

export default AdBanner;