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
        채널 분석 요약 정보 - 먼저 Analytics API 시도, 실패하면 Data API 사용
        """
        try:
            # 1단계: 먼저 YouTube Analytics API 시도 (채널 소유자인 경우)
            analytics_result = await self._try_analytics_api(access_token, channel_id, days)
            
            if analytics_result['success']:
                logger.info("YouTube Analytics API 성공 - 채널 소유자 권한 확인됨")
                return analytics_result
            else:
                logger.warning(f"YouTube Analytics API 실패: {analytics_result['message']}")
                logger.info("YouTube Data API로 대체 시도")
                
                # 2단계: Analytics API 실패 시 Data API 사용
                return await self._get_public_analytics_data(access_token, channel_id, days)
                    
        except Exception as e:
            logger.error(f"분석 데이터 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'분석 데이터 조회 실패: {str(e)}',
                'data': None
            }
    
    async def _try_analytics_api(
        self,
        access_token: str,
        channel_id: str,
        days: int
    ) -> Dict[str, Any]:
        """YouTube Analytics API 시도"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 기본 메트릭부터 시도 (수익 제외) - 확장된 메트릭 포함
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,subscribersGained,subscribersLost,comments,likes,dislikes,shares'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                logger.info(f"YouTube Analytics API 응답: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info("YouTube Analytics API 기본 메트릭 성공")
                    
                    # 수익 데이터도 시도
                    revenue_data = await self._try_revenue_metrics(access_token, channel_id, start_date, end_date)
                    
                    return self._process_full_analytics_data(data, revenue_data, days)
                else:
                    error_text = response.text
                    logger.warning(f"YouTube Analytics API 실패: {response.status_code} - {error_text}")
                    return {
                        'success': False,
                        'message': f'Analytics API 접근 실패: {response.status_code}',
                        'error_details': error_text
                    }
                    
        except Exception as e:
            logger.error(f"YouTube Analytics API 호출 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'Analytics API 호출 실패: {str(e)}',
                'data': None
            }
    
    async def _try_revenue_metrics(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """수익 메트릭 별도 시도"""
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'estimatedRevenue,estimatedAdRevenue'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    logger.info("YouTube Analytics 수익 데이터 접근 성공")
                    return response.json()
                else:
                    logger.warning(f"수익 데이터 접근 실패: {response.status_code}")
                    return None
                    
        except Exception as e:
            logger.warning(f"수익 메트릭 조회 실패: {str(e)}")
            return None
    
    def _process_full_analytics_data(self, analytics_data: Dict[str, Any], revenue_data: Dict[str, Any], days: int) -> Dict[str, Any]:
        """전체 Analytics API 데이터 처리"""
        try:
            if 'rows' not in analytics_data or not analytics_data['rows'] or not analytics_data['rows'][0]:
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
                        'period_days': days,
                        'data_source': 'YouTube Analytics API',
                        'owner_access': True
                    }
                }
            
            row = analytics_data['rows'][0]
            
            # 기본 메트릭 추출
            views = int(row[0] or 0)
            watch_time = int(row[1] or 0)
            subs_gained = int(row[2] or 0)
            subs_lost = int(row[3] or 0)
            
            # 수익 데이터 추출
            revenue = 0
            ad_revenue = 0
            if revenue_data and 'rows' in revenue_data and revenue_data['rows'] and revenue_data['rows'][0]:
                revenue_row = revenue_data['rows'][0]
                revenue = float(revenue_row[0] or 0)
                ad_revenue = float(revenue_row[1] or 0)
            
            return {
                'success': True,
                'message': f'최근 {days}일 YouTube Analytics 데이터 조회 완료',
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
                    'avg_daily_revenue': round(revenue / days, 2),
                    'data_source': 'YouTube Analytics API',
                    'owner_access': True,
                    'revenue_available': revenue > 0 or ad_revenue > 0
                }
            }
            
        except Exception as e:
            logger.error(f"YouTube Analytics 데이터 처리 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'데이터 처리 실패: {str(e)}',
                'data': None
            }
    
    async def _get_public_analytics_data(
        self,
        access_token: str,
        channel_id: str,
        days: int
    ) -> Dict[str, Any]:
        """YouTube Data API v3를 통한 공개 분석 데이터 수집"""
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 1. 채널 기본 정보 (구독자 수, 총 조회수 등)
            channel_params = {
                'part': 'statistics,snippet',
                'id': channel_id
            }
            
            async with httpx.AsyncClient() as client:
                # 채널 정보 조회
                channel_response = await client.get(
                    "https://www.googleapis.com/youtube/v3/channels",
                    headers=headers,
                    params=channel_params,
                    timeout=30.0
                )
                
                if channel_response.status_code != 200:
                    return {
                        'success': False,
                        'message': f'채널 정보 조회 실패: {channel_response.status_code}',
                        'data': None
                    }
                
                channel_data = channel_response.json()
                
                if not channel_data.get('items'):
                    return {
                        'success': False,
                        'message': '채널을 찾을 수 없습니다.',
                        'data': None
                    }
                
                stats = channel_data['items'][0]['statistics']
                
                # 2. 최근 비디오 목록으로 활동 분석
                videos_params = {
                    'part': 'statistics,snippet',
                    'channelId': channel_id,
                    'order': 'date',
                    'type': 'video',
                    'maxResults': 50,
                    'publishedAfter': (datetime.now() - timedelta(days=days)).isoformat() + 'Z'
                }
                
                videos_response = await client.get(
                    "https://www.googleapis.com/youtube/v3/search",
                    headers=headers,
                    params=videos_params,
                    timeout=30.0
                )
                
                recent_videos_count = 0
                recent_total_views = 0
                
                if videos_response.status_code == 200:
                    videos_data = videos_response.json()
                    recent_videos_count = len(videos_data.get('items', []))
                    
                    # 각 비디오의 조회수 합계 (별도 API 호출 필요)
                    video_ids = [item['id']['videoId'] for item in videos_data.get('items', []) if item['id']['kind'] == 'youtube#video']
                    
                    if video_ids:
                        video_details_params = {
                            'part': 'statistics',
                            'id': ','.join(video_ids[:10])  # 최근 10개만
                        }
                        
                        video_details_response = await client.get(
                            "https://www.googleapis.com/youtube/v3/videos",
                            headers=headers,
                            params=video_details_params,
                            timeout=30.0
                        )
                        
                        if video_details_response.status_code == 200:
                            video_details = video_details_response.json()
                            for video in video_details.get('items', []):
                                recent_total_views += int(video['statistics'].get('viewCount', 0))
                
                # 기본 데이터 구조를 Analytics API와 동일하게 맞춤
                # 최근 비디오가 없으면 총 조회수를 사용
                display_views = recent_total_views if recent_total_views > 0 else int(stats.get('viewCount', 0))
                
                result_data = {
                    'views': display_views,  # 최근 조회수 또는 총 조회수
                    'watch_time_minutes': 0,  # Data API에서는 접근 불가
                    'watch_time_hours': 0,
                    'subscribers_gained': 0,  # Data API에서는 접근 불가
                    'subscribers_lost': 0,
                    'net_subscribers': 0,
                    'estimated_revenue': 0,
                    'ad_revenue': 0,
                    'period_days': days,
                    'avg_daily_views': round(display_views / days, 0),
                    'avg_daily_revenue': 0,
                    'data_source': 'YouTube Data API v3',
                    'owner_access': False,
                    'revenue_available': False,
                    'total_subscribers': int(stats.get('subscriberCount', 0)),
                    'total_views': int(stats.get('viewCount', 0)),
                    'total_videos': int(stats.get('videoCount', 0)),
                    'recent_videos_count': recent_videos_count,
                    'recent_total_views': recent_total_views,
                    'limitation_notice': 'YouTube Analytics API 권한이 제한되어 기본 정보만 표시됩니다.'
                }
                
                logger.info(f"Data API 결과: views={recent_total_views}, total_views={stats.get('viewCount', 0)}")
                
                return {
                    'success': True,
                    'message': f'최근 {days}일 공개 분석 데이터 조회 완료',
                    'data': result_data
                }
                
        except Exception as e:
            logger.error(f"공개 분석 데이터 수집 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'분석 데이터 수집 실패: {str(e)}',
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
    
    async def get_traffic_source_data(
        self,
        access_token: str,
        channel_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """트래픽 소스 데이터 조회 (Analytics API 사용)"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 트래픽 소스별 메트릭 시도
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched',
                'dimensions': 'insightTrafficSourceType'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                logger.info(f"트래픽 소스 Analytics API 응답: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info("트래픽 소스 Analytics API 성공")
                    return self._process_traffic_source_analytics_data(data, days)
                else:
                    error_text = response.text
                    logger.warning(f"트래픽 소스 Analytics API 실패: {response.status_code} - {error_text}")
                    return {
                        'success': False,
                        'message': f'트래픽 소스 데이터 접근 불가: {response.status_code}',
                        'error_details': error_text
                    }
                    
        except Exception as e:
            logger.error(f"트래픽 소스 데이터 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'트래픽 소스 데이터 조회 실패: {str(e)}',
                'data': None
            }
    
    async def get_demographics_data(
        self,
        access_token: str,
        channel_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """인구통계 데이터 조회 (Analytics API 사용)"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            # 인구통계 메트릭 시도
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'viewerPercentage',
                'dimensions': 'ageGroup,gender'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/reports",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                logger.info(f"인구통계 Analytics API 응답: {response.status_code}")
                
                if response.status_code == 200:
                    data = response.json()
                    logger.info("인구통계 Analytics API 성공")
                    return self._process_demographics_analytics_data(data, days)
                else:
                    error_text = response.text
                    logger.warning(f"인구통계 Analytics API 실패: {response.status_code} - {error_text}")
                    return {
                        'success': False,
                        'message': f'인구통계 데이터 접근 불가: {response.status_code}',
                        'error_details': error_text
                    }
                    
        except Exception as e:
            logger.error(f"인구통계 데이터 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'인구통계 데이터 조회 실패: {str(e)}',
                'data': None
            }
    
    def _process_traffic_source_analytics_data(self, data: Dict[str, Any], days: int) -> Dict[str, Any]:
        """트래픽 소스 Analytics 데이터 처리"""
        try:
            if not data.get('rows'):
                return {
                    'success': True,
                    'data': {
                        'sources': [],
                        'total_views': 0,
                        'top_source': 'Unknown'
                    },
                    'message': '트래픽 소스 데이터가 없습니다.'
                }
            
            sources = []
            total_views = 0
            
            for row in data['rows']:
                source_type = row[0] if len(row) > 0 else 'Unknown'
                views = int(row[1] or 0) if len(row) > 1 else 0
                watch_time = int(row[2] or 0) if len(row) > 2 else 0
                
                total_views += views
                
                sources.append({
                    'type': source_type,
                    'total_views': views,
                    'total_watch_time': watch_time,
                    'total_engaged_views': views,  # Analytics API에서는 동일하게 처리
                    'percentage': 0,  # 나중에 계산
                    'details': {}
                })
            
            # 백분율 계산
            for source in sources:
                source['percentage'] = round((source['total_views'] / total_views * 100) if total_views > 0 else 0, 2)
            
            # 조회수 기준 정렬
            sources.sort(key=lambda x: x['total_views'], reverse=True)
            
            return {
                'success': True,
                'data': {
                    'sources': sources,
                    'total_views': total_views,
                    'top_source': sources[0]['type'] if sources else 'Unknown'
                },
                'message': f'트래픽 소스 분석 완료 ({days}일)'
            }
            
        except Exception as e:
            logger.error(f"트래픽 소스 Analytics 데이터 처리 오류: {str(e)}")
            return {
                'success': False,
                'message': f'트래픽 소스 데이터 처리 실패: {str(e)}',
                'data': None
            }
    
    def _process_demographics_analytics_data(self, data: Dict[str, Any], days: int) -> Dict[str, Any]:
        """인구통계 Analytics 데이터 처리"""
        try:
            if not data.get('rows'):
                return {
                    'success': True,
                    'data': {
                        'age_groups': {},
                        'gender_distribution': {'male': 0, 'female': 0},
                        'dominant_age_group': 'Unknown',
                        'dominant_gender': 'Unknown'
                    },
                    'message': '인구통계 데이터가 없습니다.'
                }
            
            age_groups = {}
            gender_totals = {'male': 0, 'female': 0}
            
            for row in data['rows']:
                age_group = row[0] if len(row) > 0 else 'Unknown'
                gender = row[1] if len(row) > 1 else 'Unknown'
                percentage = float(row[2] or 0) if len(row) > 2 else 0
                
                # 연령대별 집계
                if age_group not in age_groups:
                    age_groups[age_group] = {'male': 0, 'female': 0, 'total': 0}
                
                if gender in ['male', 'female']:
                    age_groups[age_group][gender] = percentage
                    age_groups[age_group]['total'] += percentage
                    gender_totals[gender] += percentage
            
            # 주요 연령대와 성별 찾기
            dominant_age_group = max(age_groups.items(), key=lambda x: x[1]['total'])[0] if age_groups else 'Unknown'
            dominant_gender = max(gender_totals.items(), key=lambda x: x[1])[0] if any(gender_totals.values()) else 'Unknown'
            
            return {
                'success': True,
                'data': {
                    'age_groups': age_groups,
                    'gender_distribution': gender_totals,
                    'dominant_age_group': dominant_age_group,
                    'dominant_gender': dominant_gender
                },
                'message': f'인구통계 분석 완료 ({days}일)'
            }
            
        except Exception as e:
            logger.error(f"인구통계 Analytics 데이터 처리 오류: {str(e)}")
            return {
                'success': False,
                'message': f'인구통계 데이터 처리 실패: {str(e)}',
                'data': None
            }