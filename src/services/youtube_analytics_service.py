"""YouTube Analytics API 서비스"""

import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class YouTubeAnalyticsService:
    """YouTube Analytics API를 통한 채널 수익 및 상세 분석 서비스"""
    
    def __init__(self):
        self.base_url = "https://youtubeanalytics.googleapis.com/v2"
    
    async def get_channel_revenue(
        self, 
        access_token: str, 
        channel_id: str,
        start_date: str = None,
        end_date: str = None
    ) -> Dict[str, Any]:
        """
        채널 수익 정보 조회
        
        Args:
            access_token: OAuth 액세스 토큰
            channel_id: 채널 ID
            start_date: 시작 날짜 (YYYY-MM-DD, 기본값: 30일 전)
            end_date: 종료 날짜 (YYYY-MM-DD, 기본값: 오늘)
        """
        try:
            # 기본 날짜 설정 (최근 30일)
            if not start_date:
                start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
            if not end_date:
                end_date = datetime.now().strftime('%Y-%m-%d')
            
            # YouTube Analytics API 호출
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 수익 관련 메트릭 쿼리
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'estimatedRevenue,estimatedAdRevenue,estimatedRedPartnerRevenue,grossRevenue',
                'dimensions': 'day'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._process_revenue_data(data, start_date, end_date)
                else:
                    logger.error(f"YouTube Analytics API 오류: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'수익 데이터 조회 실패: {response.status_code}',
                        'data': None
                    }
                    
        except Exception as e:
            logger.error(f"수익 데이터 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'수익 데이터 조회 실패: {str(e)}',
                'data': None
            }
    
    async def get_channel_analytics_summary(
        self,
        access_token: str,
        channel_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        채널 분석 요약 정보 (조회수, 시청시간, 구독자, 수익)
        """
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 종합 분석 메트릭
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,subscribersGained,subscribersLost,estimatedRevenue,estimatedAdRevenue'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._process_analytics_summary(data, days)
                else:
                    return {
                        'success': False,
                        'message': f'분석 데이터 조회 실패: {response.status_code}',
                        'data': None
                    }
                    
        except Exception as e:
            logger.error(f"분석 데이터 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'분석 데이터 조회 실패: {str(e)}',
                'data': None
            }
    
    def _process_revenue_data(self, data: Dict[str, Any], start_date: str, end_date: str) -> Dict[str, Any]:
        """수익 데이터 처리"""
        try:
            if 'rows' not in data or not data['rows']:
                return {
                    'success': True,
                    'message': '수익 데이터가 없습니다.',
                    'data': {
                        'total_revenue': 0,
                        'ad_revenue': 0,
                        'partner_revenue': 0,
                        'gross_revenue': 0,
                        'period': f'{start_date} ~ {end_date}',
                        'daily_data': []
                    }
                }
            
            # 컬럼 헤더 정보
            column_headers = {col['name']: i for i, col in enumerate(data.get('columnHeaders', []))}
            
            total_revenue = 0
            total_ad_revenue = 0
            total_partner_revenue = 0
            total_gross_revenue = 0
            daily_data = []
            
            for row in data['rows']:
                # 각 메트릭 추출
                day = row[column_headers.get('day', 0)]
                estimated_revenue = float(row[column_headers.get('estimatedRevenue', 1)] or 0)
                ad_revenue = float(row[column_headers.get('estimatedAdRevenue', 2)] or 0)
                partner_revenue = float(row[column_headers.get('estimatedRedPartnerRevenue', 3)] or 0)
                gross_revenue = float(row[column_headers.get('grossRevenue', 4)] or 0)
                
                # 누적 계산
                total_revenue += estimated_revenue
                total_ad_revenue += ad_revenue
                total_partner_revenue += partner_revenue
                total_gross_revenue += gross_revenue
                
                daily_data.append({
                    'date': day,
                    'revenue': estimated_revenue,
                    'ad_revenue': ad_revenue,
                    'partner_revenue': partner_revenue,
                    'gross_revenue': gross_revenue
                })
            
            return {
                'success': True,
                'message': '수익 데이터 조회 완료',
                'data': {
                    'total_revenue': round(total_revenue, 2),
                    'ad_revenue': round(total_ad_revenue, 2),
                    'partner_revenue': round(total_partner_revenue, 2),
                    'gross_revenue': round(total_gross_revenue, 2),
                    'period': f'{start_date} ~ {end_date}',
                    'daily_data': daily_data,
                    'currency': 'USD'  # YouTube Analytics API는 기본적으로 USD
                }
            }
            
        except Exception as e:
            logger.error(f"수익 데이터 처리 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'수익 데이터 처리 실패: {str(e)}',
                'data': None
            }
    
    def _process_analytics_summary(self, data: Dict[str, Any], days: int) -> Dict[str, Any]:
        """분석 요약 데이터 처리"""
        try:
            if 'rows' not in data or not data['rows'] or not data['rows'][0]:
                return {
                    'success': True,
                    'message': '분석 데이터가 없습니다.',
                    'data': {
                        'views': 0,
                        'watch_time_minutes': 0,
                        'subscribers_gained': 0,
                        'subscribers_lost': 0,
                        'net_subscribers': 0,
                        'estimated_revenue': 0,
                        'ad_revenue': 0,
                        'period_days': days
                    }
                }
            
            row = data['rows'][0]  # 집계된 데이터는 첫 번째 행에 있음
            
            # 각 메트릭 추출 (순서대로: views, estimatedMinutesWatched, subscribersGained, subscribersLost, estimatedRevenue, estimatedAdRevenue)
            views = int(row[0] or 0)
            watch_time = int(row[1] or 0)
            subs_gained = int(row[2] or 0)
            subs_lost = int(row[3] or 0)
            revenue = float(row[4] or 0)
            ad_revenue = float(row[5] or 0)
            
            return {
                'success': True,
                'message': f'최근 {days}일 분석 데이터 조회 완료',
                'data': {
                    'views': views,
                    'watch_time_minutes': watch_time,
                    'watch_time_hours': round(watch_time / 60, 1),
                    'subscribers_gained': subs_gained,
                    'subscribers_lost': subs_lost,
                    'net_subscribers': subs_gained - subs_lost,
                    'estimated_revenue': round(revenue, 2),
                    'ad_revenue': round(ad_revenue, 2),
                    'period_days': days,
                    'avg_daily_views': round(views / days, 0),
                    'avg_daily_revenue': round(revenue / days, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"분석 요약 데이터 처리 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'분석 데이터 처리 실패: {str(e)}',
                'data': None
            }