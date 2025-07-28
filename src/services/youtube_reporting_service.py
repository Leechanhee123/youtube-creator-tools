"""YouTube Reporting API 서비스"""

import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class YouTubeReportingService:
    """YouTube Reporting API를 통한 상세 채널 리포트 서비스"""
    
    def __init__(self):
        self.base_url = "https://youtubeanalytics.googleapis.com/v2"
        
    async def get_comprehensive_analytics(
        self, 
        access_token: str,
        channel_id: str, 
        days: int = 30
    ) -> Dict[str, Any]:
        """종합 채널 분석 데이터 수집"""
        try:
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            logger.info(f"종합 분석 시작: {channel_id}, {start_date} ~ {end_date}")
            
            # 모든 리포트 병렬 실행
            reports = await self._fetch_all_reports(
                access_token, channel_id, start_date, end_date, days
            )
            
            return {
                'success': True,
                'message': f'종합 채널 분석 완료 ({days}일)',
                'data': reports,
                'period': {'start_date': start_date, 'end_date': end_date, 'days': days}
            }
            
        except Exception as e:
            logger.error(f"종합 분석 실패: {str(e)}")
            return {
                'success': False,
                'message': f'종합 분석 실패: {str(e)}',
                'data': None
            }
    
    async def _fetch_all_reports(
        self,
        access_token: str,
        channel_id: str,
        start_date: str,
        end_date: str,
        days: int
    ) -> Dict[str, Any]:
        """모든 리포트 데이터를 병렬로 수집"""
        
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Accept': 'application/json'
        }
        
        async with httpx.AsyncClient() as client:
            # 1. 기본 사용자 활동 보고서
            basic_metrics = await self._get_basic_activity_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 2. 트래픽 소스 보고서
            traffic_sources = await self._get_traffic_source_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 3. 기기/OS 보고서
            device_analysis = await self._get_device_os_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 4. 시청자 인구통계 보고서
            demographics = await self._get_demographics_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 5. 재생 위치 보고서
            playback_locations = await self._get_playback_location_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 6. 카드 및 최종 화면 보고서
            engagement_features = await self._get_engagement_features_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 7. 수익 보고서 (권한 있는 경우)
            revenue_analysis = await self._get_revenue_report(
                client, headers, channel_id, start_date, end_date
            )
            
            # 8. 재생목록 보고서
            playlist_analysis = await self._get_playlist_report(
                client, headers, channel_id, start_date, end_date
            )
            
            return {
                'basic_metrics': basic_metrics,
                'traffic_sources': traffic_sources,
                'device_analysis': device_analysis,
                'demographics': demographics,
                'playback_locations': playback_locations,
                'engagement_features': engagement_features,
                'revenue_analysis': revenue_analysis,
                'playlist_analysis': playlist_analysis,
                'summary': self._generate_summary(
                    basic_metrics, traffic_sources, device_analysis, demographics, days
                )
            }
    
    async def _get_basic_activity_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """기본 사용자 활동 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,averageViewDuration,engagedViews,comments,likes,dislikes,shares,subscribersGained,subscribersLost',
                'dimensions': 'day'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._process_basic_activity_data(data)
            else:
                logger.warning(f"기본 활동 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"기본 활동 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_traffic_source_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """트래픽 소스 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,averageViewDuration,engagedViews',
                'dimensions': 'insightTrafficSourceType,insightTrafficSourceDetail'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            logger.info(f"트래픽 소스 API 응답: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"트래픽 소스 API 에러: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"트래픽 소스 데이터: {data}")
                return self._process_traffic_source_data(data)
            else:
                logger.warning(f"트래픽 소스 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"트래픽 소스 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_device_os_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """기기/OS 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,averageViewDuration,engagedViews',
                'dimensions': 'deviceType,operatingSystem'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._process_device_os_data(data)
            else:
                logger.warning(f"기기/OS 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"기기/OS 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_demographics_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """시청자 인구통계 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'viewerPercentage',
                'dimensions': 'ageGroup,gender'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            logger.info(f"인구통계 API 응답: {response.status_code}")
            if response.status_code != 200:
                logger.error(f"인구통계 API 에러: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"인구통계 데이터: {data}")
                return self._process_demographics_data(data)
            else:
                logger.warning(f"인구통계 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"인구통계 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_playback_location_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """재생 위치 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched',
                'dimensions': 'insightPlaybackLocationType,insightPlaybackLocationDetail'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._process_playback_location_data(data)
            else:
                logger.warning(f"재생 위치 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"재생 위치 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_engagement_features_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """카드 및 최종 화면 보고서"""
        try:
            # 카드 데이터
            card_params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'cardImpressions,cardClicks,cardClickRate'
            }
            
            # 최종 화면 데이터
            endscreen_params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'endScreenImpressions,endScreenClicks,endScreenClickRate'
            }
            
            card_response = await client.get(f"{self.base_url}/reports", headers=headers, params=card_params)
            endscreen_response = await client.get(f"{self.base_url}/reports", headers=headers, params=endscreen_params)
            
            card_data = card_response.json() if card_response.status_code == 200 else None
            endscreen_data = endscreen_response.json() if endscreen_response.status_code == 200 else None
            
            return self._process_engagement_features_data(card_data, endscreen_data)
                
        except Exception as e:
            logger.error(f"참여 기능 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_revenue_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """수익 보고서 (광고 성과 포함)"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'grossRevenue,adImpressions,cpm,playbackBasedCpm,adRevenue,estimatedRevenue',
                'dimensions': 'day'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._process_revenue_data(data)
            else:
                logger.warning(f"수익 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"수익 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    async def _get_playlist_report(
        self,
        client: httpx.AsyncClient,
        headers: Dict[str, str],
        channel_id: str,
        start_date: str,
        end_date: str
    ) -> Dict[str, Any]:
        """재생목록 보고서"""
        try:
            params = {
                'ids': f'channel=={channel_id}',
                'startDate': start_date,
                'endDate': end_date,
                'metrics': 'views,estimatedMinutesWatched,averageViewDuration,playlistStarts,viewsPerPlaylistStart,averageTimeInPlaylist',
                'dimensions': 'playlist'
            }
            
            response = await client.get(f"{self.base_url}/reports", headers=headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                return self._process_playlist_data(data)
            else:
                logger.warning(f"재생목록 보고서 실패: {response.status_code}")
                return {'success': False, 'data': None, 'error': response.text}
                
        except Exception as e:
            logger.error(f"재생목록 보고서 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_basic_activity_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """기본 활동 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '데이터 없음'}
            
            total_views = 0
            total_watch_time = 0
            total_engagement = 0
            total_comments = 0
            total_likes = 0
            total_shares = 0
            total_subs_gained = 0
            total_subs_lost = 0
            daily_data = []
            
            for row in data['rows']:
                day = row[0]
                views = int(row[1] or 0)
                watch_time = int(row[2] or 0)
                avg_duration = float(row[3] or 0)
                engaged_views = int(row[4] or 0)
                comments = int(row[5] or 0)
                likes = int(row[6] or 0)
                dislikes = int(row[7] or 0)
                shares = int(row[8] or 0)
                subs_gained = int(row[9] or 0)
                subs_lost = int(row[10] or 0)
                
                total_views += views
                total_watch_time += watch_time
                total_engagement += engaged_views
                total_comments += comments
                total_likes += likes
                total_shares += shares
                total_subs_gained += subs_gained
                total_subs_lost += subs_lost
                
                daily_data.append({
                    'date': day,
                    'views': views,
                    'watch_time_minutes': watch_time,
                    'avg_view_duration': avg_duration,
                    'engaged_views': engaged_views,
                    'comments': comments,
                    'likes': likes,
                    'dislikes': dislikes,
                    'shares': shares,
                    'subscribers_gained': subs_gained,
                    'subscribers_lost': subs_lost,
                    'engagement_rate': round((engaged_views / views * 100) if views > 0 else 0, 2)
                })
            
            return {
                'success': True,
                'data': {
                    'totals': {
                        'views': total_views,
                        'watch_time_minutes': total_watch_time,
                        'watch_time_hours': round(total_watch_time / 60, 1),
                        'engaged_views': total_engagement,
                        'comments': total_comments,
                        'likes': total_likes,
                        'shares': total_shares,
                        'subscribers_gained': total_subs_gained,
                        'subscribers_lost': total_subs_lost,
                        'net_subscribers': total_subs_gained - total_subs_lost,
                        'engagement_rate': round((total_engagement / total_views * 100) if total_views > 0 else 0, 2),
                        'avg_daily_views': round(total_views / len(daily_data) if daily_data else 0, 0)
                    },
                    'daily_breakdown': daily_data
                }
            }
            
        except Exception as e:
            logger.error(f"기본 활동 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_traffic_source_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """트래픽 소스 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '데이터 없음'}
            
            traffic_sources = {}
            total_views = 0
            
            for row in data['rows']:
                source_type = row[0]
                source_detail = row[1] if len(row) > 1 else 'Unknown'
                views = int(row[2] or 0)
                watch_time = int(row[3] or 0)
                avg_duration = float(row[4] or 0)
                engaged_views = int(row[5] or 0)
                
                total_views += views
                
                if source_type not in traffic_sources:
                    traffic_sources[source_type] = {
                        'type': source_type,
                        'total_views': 0,
                        'total_watch_time': 0,
                        'total_engaged_views': 0,
                        'details': {}
                    }
                
                traffic_sources[source_type]['total_views'] += views
                traffic_sources[source_type]['total_watch_time'] += watch_time
                traffic_sources[source_type]['total_engaged_views'] += engaged_views
                
                traffic_sources[source_type]['details'][source_detail] = {
                    'views': views,
                    'watch_time': watch_time,
                    'avg_duration': avg_duration,
                    'engaged_views': engaged_views
                }
            
            # 백분율 계산
            for source in traffic_sources.values():
                source['percentage'] = round((source['total_views'] / total_views * 100) if total_views > 0 else 0, 2)
            
            # 상위 소스 정렬
            sorted_sources = sorted(traffic_sources.values(), key=lambda x: x['total_views'], reverse=True)
            
            return {
                'success': True,
                'data': {
                    'total_views': total_views,
                    'sources': sorted_sources,
                    'top_source': sorted_sources[0]['type'] if sorted_sources else 'Unknown'
                }
            }
            
        except Exception as e:
            logger.error(f"트래픽 소스 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_device_os_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """기기/OS 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '데이터 없음'}
            
            devices = {}
            operating_systems = {}
            total_views = 0
            
            for row in data['rows']:
                device_type = row[0]
                os = row[1]
                views = int(row[2] or 0)
                watch_time = int(row[3] or 0)
                avg_duration = float(row[4] or 0)
                engaged_views = int(row[5] or 0)
                
                total_views += views
                
                # 기기별 집계
                if device_type not in devices:
                    devices[device_type] = {'views': 0, 'watch_time': 0, 'engaged_views': 0}
                devices[device_type]['views'] += views
                devices[device_type]['watch_time'] += watch_time
                devices[device_type]['engaged_views'] += engaged_views
                
                # OS별 집계
                if os not in operating_systems:
                    operating_systems[os] = {'views': 0, 'watch_time': 0, 'engaged_views': 0}
                operating_systems[os]['views'] += views
                operating_systems[os]['watch_time'] += watch_time
                operating_systems[os]['engaged_views'] += engaged_views
            
            # 백분율 계산
            for device in devices.values():
                device['percentage'] = round((device['views'] / total_views * 100) if total_views > 0 else 0, 2)
            
            for os in operating_systems.values():
                os['percentage'] = round((os['views'] / total_views * 100) if total_views > 0 else 0, 2)
            
            return {
                'success': True,
                'data': {
                    'total_views': total_views,
                    'devices': dict(sorted(devices.items(), key=lambda x: x[1]['views'], reverse=True)),
                    'operating_systems': dict(sorted(operating_systems.items(), key=lambda x: x[1]['views'], reverse=True))
                }
            }
            
        except Exception as e:
            logger.error(f"기기/OS 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_demographics_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """인구통계 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '데이터 없음'}
            
            age_groups = {}
            genders = {}
            
            for row in data['rows']:
                age_group = row[0]
                gender = row[1]
                percentage = float(row[2] or 0)
                
                # 연령대별 집계
                if age_group not in age_groups:
                    age_groups[age_group] = {'male': 0, 'female': 0, 'total': 0}
                age_groups[age_group][gender] = percentage
                age_groups[age_group]['total'] += percentage
                
                # 성별 집계
                if gender not in genders:
                    genders[gender] = 0
                genders[gender] += percentage
            
            return {
                'success': True,
                'data': {
                    'age_groups': age_groups,
                    'gender_distribution': genders,
                    'dominant_age_group': max(age_groups.items(), key=lambda x: x[1]['total'])[0] if age_groups else None,
                    'dominant_gender': max(genders.items(), key=lambda x: x[1])[0] if genders else None
                }
            }
            
        except Exception as e:
            logger.error(f"인구통계 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_playback_location_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """재생 위치 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '데이터 없음'}
            
            locations = {}
            total_views = 0
            
            for row in data['rows']:
                location_type = row[0]
                location_detail = row[1] if len(row) > 1 else 'Unknown'
                views = int(row[2] or 0)
                watch_time = int(row[3] or 0)
                
                total_views += views
                
                if location_type not in locations:
                    locations[location_type] = {
                        'type': location_type,
                        'total_views': 0,
                        'total_watch_time': 0,
                        'details': {}
                    }
                
                locations[location_type]['total_views'] += views
                locations[location_type]['total_watch_time'] += watch_time
                locations[location_type]['details'][location_detail] = {
                    'views': views,
                    'watch_time': watch_time
                }
            
            # 백분율 계산
            for location in locations.values():
                location['percentage'] = round((location['total_views'] / total_views * 100) if total_views > 0 else 0, 2)
            
            sorted_locations = sorted(locations.values(), key=lambda x: x['total_views'], reverse=True)
            
            return {
                'success': True,
                'data': {
                    'total_views': total_views,
                    'locations': sorted_locations,
                    'primary_location': sorted_locations[0]['type'] if sorted_locations else 'Unknown'
                }
            }
            
        except Exception as e:
            logger.error(f"재생 위치 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_engagement_features_data(self, card_data: Dict[str, Any], endscreen_data: Dict[str, Any]) -> Dict[str, Any]:
        """참여 기능 데이터 처리"""
        try:
            result = {'success': True, 'data': {'cards': None, 'end_screens': None}}
            
            # 카드 데이터 처리
            if card_data and card_data.get('rows'):
                card_row = card_data['rows'][0]
                result['data']['cards'] = {
                    'impressions': int(card_row[0] or 0),
                    'clicks': int(card_row[1] or 0),
                    'click_rate': float(card_row[2] or 0)
                }
            
            # 최종 화면 데이터 처리
            if endscreen_data and endscreen_data.get('rows'):
                endscreen_row = endscreen_data['rows'][0]
                result['data']['end_screens'] = {
                    'impressions': int(endscreen_row[0] or 0),
                    'clicks': int(endscreen_row[1] or 0),
                    'click_rate': float(endscreen_row[2] or 0)
                }
            
            return result
            
        except Exception as e:
            logger.error(f"참여 기능 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_revenue_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """수익 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '수익 데이터 없음'}
            
            total_gross_revenue = 0
            total_ad_impressions = 0
            total_ad_revenue = 0
            total_estimated_revenue = 0
            daily_revenue = []
            
            for row in data['rows']:
                day = row[0]
                gross_revenue = float(row[1] or 0)
                ad_impressions = int(row[2] or 0)
                cpm = float(row[3] or 0)
                playback_cpm = float(row[4] or 0)
                ad_revenue = float(row[5] or 0)
                estimated_revenue = float(row[6] or 0)
                
                total_gross_revenue += gross_revenue
                total_ad_impressions += ad_impressions
                total_ad_revenue += ad_revenue
                total_estimated_revenue += estimated_revenue
                
                daily_revenue.append({
                    'date': day,
                    'gross_revenue': gross_revenue,
                    'ad_impressions': ad_impressions,
                    'cpm': cpm,
                    'playback_cpm': playback_cpm,
                    'ad_revenue': ad_revenue,
                    'estimated_revenue': estimated_revenue
                })
            
            avg_cpm = total_ad_revenue / (total_ad_impressions / 1000) if total_ad_impressions > 0 else 0
            
            return {
                'success': True,
                'data': {
                    'totals': {
                        'gross_revenue': round(total_gross_revenue, 2),
                        'ad_revenue': round(total_ad_revenue, 2),
                        'estimated_revenue': round(total_estimated_revenue, 2),
                        'ad_impressions': total_ad_impressions,
                        'average_cpm': round(avg_cpm, 2),
                        'daily_avg_revenue': round(total_estimated_revenue / len(daily_revenue) if daily_revenue else 0, 2)
                    },
                    'daily_breakdown': daily_revenue
                }
            }
            
        except Exception as e:
            logger.error(f"수익 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _process_playlist_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """재생목록 데이터 처리"""
        try:
            if not data.get('rows'):
                return {'success': True, 'data': None, 'message': '재생목록 데이터 없음'}
            
            playlists = []
            total_views = 0
            total_starts = 0
            
            for row in data['rows']:
                playlist_id = row[0]
                views = int(row[1] or 0)
                watch_time = int(row[2] or 0)
                avg_duration = float(row[3] or 0)
                starts = int(row[4] or 0)
                views_per_start = float(row[5] or 0)
                avg_time_in_playlist = float(row[6] or 0)
                
                total_views += views
                total_starts += starts
                
                playlists.append({
                    'playlist_id': playlist_id,
                    'views': views,
                    'watch_time': watch_time,
                    'avg_view_duration': avg_duration,
                    'playlist_starts': starts,
                    'views_per_start': views_per_start,
                    'avg_time_in_playlist': avg_time_in_playlist
                })
            
            # 성과순 정렬
            playlists.sort(key=lambda x: x['views'], reverse=True)
            
            return {
                'success': True,
                'data': {
                    'totals': {
                        'total_views': total_views,
                        'total_starts': total_starts,
                        'avg_views_per_start': round(total_views / total_starts if total_starts > 0 else 0, 2)
                    },
                    'playlists': playlists[:10],  # 상위 10개만
                    'playlist_count': len(playlists)
                }
            }
            
        except Exception as e:
            logger.error(f"재생목록 데이터 처리 오류: {str(e)}")
            return {'success': False, 'data': None, 'error': str(e)}
    
    def _generate_summary(
        self,
        basic_metrics: Dict[str, Any],
        traffic_sources: Dict[str, Any],
        device_analysis: Dict[str, Any],
        demographics: Dict[str, Any],
        days: int
    ) -> Dict[str, Any]:
        """종합 요약 생성"""
        try:
            summary = {
                'period_days': days,
                'data_quality': 'good',
                'insights': []
            }
            
            # 기본 메트릭 요약
            if basic_metrics.get('success') and basic_metrics.get('data'):
                basic_data = basic_metrics['data']['totals']
                summary['total_views'] = basic_data.get('views', 0)
                summary['total_watch_time_hours'] = basic_data.get('watch_time_hours', 0)
                summary['engagement_rate'] = basic_data.get('engagement_rate', 0)
                summary['net_subscribers'] = basic_data.get('net_subscribers', 0)
                
                # 인사이트 생성
                if basic_data.get('engagement_rate', 0) > 50:
                    summary['insights'].append("높은 참여율을 보이는 우수한 채널입니다.")
                
                if basic_data.get('net_subscribers', 0) > 0:
                    summary['insights'].append(f"구독자가 {basic_data['net_subscribers']}명 순증가했습니다.")
            
            # 트래픽 소스 요약
            if traffic_sources.get('success') and traffic_sources.get('data'):
                summary['primary_traffic_source'] = traffic_sources['data'].get('top_source')
                if summary['primary_traffic_source'] == 'SEARCH':
                    summary['insights'].append("검색을 통한 유입이 많아 SEO 최적화가 잘 되어 있습니다.")
                elif summary['primary_traffic_source'] == 'BROWSE':
                    summary['insights'].append("YouTube 추천 알고리즘에 잘 노출되고 있습니다.")
            
            # 기기 분석 요약
            if device_analysis.get('success') and device_analysis.get('data'):
                devices = device_analysis['data'].get('devices', {})
                if devices:
                    top_device = max(devices.items(), key=lambda x: x[1]['views'])[0]
                    summary['primary_device'] = top_device
                    
                    if top_device == 'MOBILE':
                        summary['insights'].append("모바일 사용자가 많으므로 모바일 최적화가 중요합니다.")
            
            # 인구통계 요약
            if demographics.get('success') and demographics.get('data'):
                demo_data = demographics['data']
                summary['dominant_age_group'] = demo_data.get('dominant_age_group')
                summary['dominant_gender'] = demo_data.get('dominant_gender')
            
            return summary
            
        except Exception as e:
            logger.error(f"요약 생성 오류: {str(e)}")
            return {
                'period_days': days,
                'data_quality': 'limited',
                'insights': ['데이터 분석 중 일부 오류가 발생했습니다.']
            }