from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from typing import Dict, List, Optional, Any
import logging
from src.core.config import settings

logger = logging.getLogger(__name__)

class YouTubeDataAPIService:
    """YouTube Data API v3 서비스 클래스"""
    
    def __init__(self):
        self.api_key = settings.YOUTUBE_API_KEY
        self.service_name = settings.YOUTUBE_API_SERVICE_NAME
        self.version = settings.YOUTUBE_API_VERSION
        self._service = None
    
    def _get_service(self):
        """YouTube API 서비스 인스턴스를 반환합니다."""
        if not self.api_key:
            raise ValueError("YouTube API Key is not configured")
        
        if not self._service:
            try:
                self._service = build(
                    self.service_name, 
                    self.version, 
                    developerKey=self.api_key
                )
                logger.info("YouTube Data API service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize YouTube Data API service: {str(e)}")
                raise
        
        return self._service
    
    def _extract_channel_info_from_url(self, url: str) -> Dict[str, str]:
        """YouTube URL에서 채널 정보를 추출합니다."""
        import re
        from urllib.parse import unquote
        
        # URL 디코딩 처리
        decoded_url = unquote(url)
        
        # 다양한 YouTube 채널 URL 패턴들
        patterns = [
            # https://www.youtube.com/channel/UCxxxxxx
            r'youtube\.com/channel/([A-Za-z0-9_-]+)',
            # https://www.youtube.com/@username (한국어 지원)
            r'youtube\.com/@([^/?&\s]+)',
            # https://www.youtube.com/c/username (한국어 지원)
            r'youtube\.com/c/([^/?&\s]+)',
            # https://www.youtube.com/user/username
            r'youtube\.com/user/([A-Za-z0-9_.-]+)',
        ]
        
        for i, pattern in enumerate(patterns):
            match = re.search(pattern, decoded_url)
            if match:
                value = match.group(1)
                if i == 0:  # channel ID 패턴
                    return {'channel_id': value}
                elif i == 1:  # @ 핸들 패턴
                    return {'handle': '@' + value}
                else:  # username 패턴
                    return {'username': value}
        
        return {}

    async def get_channel_info(self, channel_id: str = None, username: str = None, handle: str = None, url: str = None) -> Dict[str, Any]:
        """
        채널 정보를 조회합니다.
        
        Args:
            channel_id: 채널 ID (UCxxxxxx 형식)
            username: 사용자명 (@username 형식)
            handle: 핸들 (@handle 형식)
            url: YouTube 채널 URL (자동으로 파싱됨)
        
        Returns:
            채널 정보 딕셔너리
        """
        try:
            service = self._get_service()
            
            # URL이 제공된 경우 파싱
            if url:
                extracted = self._extract_channel_info_from_url(url)
                if extracted:
                    channel_id = extracted.get('channel_id', channel_id)
                    username = extracted.get('username', username)  
                    handle = extracted.get('handle', handle)
            
            # 요청 파라미터 설정
            params = {
                'part': 'snippet,statistics,brandingSettings,status,topicDetails',
                'maxResults': 1
            }
            
            if channel_id:
                params['id'] = channel_id
            elif username:
                params['forUsername'] = username.replace('@', '')
            elif handle:
                params['forHandle'] = handle.replace('@', '')
            else:
                raise ValueError("Either channel_id, username, handle, or url must be provided")
            
            # API 호출
            request = service.channels().list(**params)
            response = request.execute()
            
            if not response.get('items'):
                return {
                    'success': False,
                    'message': 'Channel not found',
                    'data': None
                }
            
            channel_data = response['items'][0]
            
            # 채널 정보 정리
            channel_info = self._process_channel_data(channel_data)
            
            return {
                'success': True,
                'message': 'Channel information retrieved successfully',
                'data': channel_info
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error getting channel info: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }
    
    def _process_channel_data(self, channel_data: Dict) -> Dict[str, Any]:
        """채널 데이터를 처리하고 정리합니다."""
        snippet = channel_data.get('snippet', {})
        statistics = channel_data.get('statistics', {})
        branding = channel_data.get('brandingSettings', {})
        status = channel_data.get('status', {})
        topic_details = channel_data.get('topicDetails', {})
        
        return {
            'channel_id': channel_data.get('id'),
            'title': snippet.get('title'),
            'description': snippet.get('description'),
            'custom_url': snippet.get('customUrl'),
            'published_at': snippet.get('publishedAt'),
            'thumbnails': snippet.get('thumbnails', {}),
            'default_language': snippet.get('defaultLanguage'),
            'country': snippet.get('country'),
            
            # 통계 정보
            'statistics': {
                'view_count': int(statistics.get('viewCount', 0)),
                'subscriber_count': int(statistics.get('subscriberCount', 0)),
                'hidden_subscriber_count': statistics.get('hiddenSubscriberCount', False),
                'video_count': int(statistics.get('videoCount', 0))
            },
            
            # 브랜딩 정보
            'branding': {
                'channel_title': branding.get('channel', {}).get('title'),
                'channel_description': branding.get('channel', {}).get('description'),
                'keywords': branding.get('channel', {}).get('keywords'),
                'banner_image_url': branding.get('image', {}).get('bannerExternalUrl')
            },
            
            # 상태 정보
            'status': {
                'privacy_status': status.get('privacyStatus'),
                'is_linked': status.get('isLinked'),
                'long_uploads_status': status.get('longUploadsStatus'),
                'made_for_kids': status.get('madeForKids')
            },
            
            # 주제/카테고리 정보
            'topic_details': {
                'topic_ids': topic_details.get('topicIds', []),
                'topic_categories': topic_details.get('topicCategories', [])
            }
        }
    
    async def get_channel_videos(self, channel_id: str, max_results: int = 50, order: str = 'date', page_token: str = None) -> Dict[str, Any]:
        """
        채널의 비디오 목록을 조회합니다.
        
        Args:
            channel_id: 채널 ID
            max_results: 최대 결과 수 (1-50)
            order: 정렬 순서 (date, rating, relevance, title, videoCount, viewCount)
        
        Returns:
            비디오 목록
        """
        try:
            service = self._get_service()
            
            # 채널의 업로드 플레이리스트 ID 가져오기
            channels_response = service.channels().list(
                part='contentDetails',
                id=channel_id
            ).execute()
            
            if not channels_response.get('items'):
                return {
                    'success': False,
                    'message': 'Channel not found',
                    'data': None
                }
            
            uploads_playlist_id = channels_response['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            
            # 플레이리스트에서 비디오 목록 가져오기
            params = {
                'part': 'snippet,contentDetails',
                'playlistId': uploads_playlist_id,
                'maxResults': max_results
            }
            
            if page_token:
                params['pageToken'] = page_token
                
            playlist_response = service.playlistItems().list(**params).execute()
            
            videos = []
            for item in playlist_response.get('items', []):
                video_info = self._process_video_data(item)
                videos.append(video_info)
            
            return {
                'success': True,
                'message': f'Retrieved {len(videos)} videos',
                'data': {
                    'videos': videos,
                    'total_results': playlist_response.get('pageInfo', {}).get('totalResults', 0),
                    'next_page_token': playlist_response.get('nextPageToken')
                }
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error getting channel videos: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }
    
    def _process_video_data(self, video_item: Dict) -> Dict[str, Any]:
        """비디오 데이터를 처리하고 정리합니다."""
        snippet = video_item.get('snippet', {})
        content_details = video_item.get('contentDetails', {})
        
        return {
            'video_id': content_details.get('videoId'),
            'title': snippet.get('title'),
            'description': snippet.get('description'),
            'published_at': snippet.get('publishedAt'),
            'thumbnails': snippet.get('thumbnails', {}),
            'channel_id': snippet.get('channelId'),
            'channel_title': snippet.get('channelTitle'),
            'video_owner_channel_title': snippet.get('videoOwnerChannelTitle'),
            'video_owner_channel_id': snippet.get('videoOwnerChannelId'),
            'video_url': f"https://www.youtube.com/watch?v={content_details.get('videoId')}"
        }
    
    async def get_video_statistics(self, video_id: str) -> Dict[str, Any]:
        """
        비디오의 상세 통계 정보를 조회합니다.
        
        Args:
            video_id: 비디오 ID
        
        Returns:
            비디오 통계 정보
        """
        try:
            service = self._get_service()
            
            request = service.videos().list(
                part='snippet,statistics,status,contentDetails',
                id=video_id
            )
            response = request.execute()
            
            if not response.get('items'):
                return {
                    'success': False,
                    'message': 'Video not found',
                    'data': None
                }
            
            video_data = response['items'][0]
            video_info = self._process_detailed_video_data(video_data)
            
            return {
                'success': True,
                'message': 'Video statistics retrieved successfully',
                'data': video_info
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error getting video statistics: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }
    
    def _process_detailed_video_data(self, video_data: Dict) -> Dict[str, Any]:
        """상세 비디오 데이터를 처리하고 정리합니다."""
        snippet = video_data.get('snippet', {})
        statistics = video_data.get('statistics', {})
        status = video_data.get('status', {})
        content_details = video_data.get('contentDetails', {})
        
        return {
            'video_id': video_data.get('id'),
            'title': snippet.get('title'),
            'description': snippet.get('description'),
            'channel_id': snippet.get('channelId'),
            'channel_title': snippet.get('channelTitle'),
            'published_at': snippet.get('publishedAt'),
            'thumbnails': snippet.get('thumbnails', {}),
            'tags': snippet.get('tags', []),
            'category_id': snippet.get('categoryId'),
            'default_language': snippet.get('defaultLanguage'),
            'default_audio_language': snippet.get('defaultAudioLanguage'),
            
            # 통계 정보
            'statistics': {
                'view_count': int(statistics.get('viewCount', 0)),
                'like_count': int(statistics.get('likeCount', 0)),
                'favorite_count': int(statistics.get('favoriteCount', 0)),
                'comment_count': int(statistics.get('commentCount', 0))
            },
            
            # 상태 정보
            'status': {
                'upload_status': status.get('uploadStatus'),
                'privacy_status': status.get('privacyStatus'),
                'license': status.get('license'),
                'embeddable': status.get('embeddable'),
                'public_stats_viewable': status.get('publicStatsViewable'),
                'made_for_kids': status.get('madeForKids')
            },
            
            # 콘텐츠 세부 정보
            'content_details': {
                'duration': content_details.get('duration'),
                'dimension': content_details.get('dimension'),
                'definition': content_details.get('definition'),
                'caption': content_details.get('caption'),
                'licensed_content': content_details.get('licensedContent'),
                'projection': content_details.get('projection')
            }
        }
    
    async def search_channels(self, query: str, max_results: int = 25) -> Dict[str, Any]:
        """
        채널을 검색합니다.
        
        Args:
            query: 검색어
            max_results: 최대 결과 수
        
        Returns:
            검색된 채널 목록
        """
        try:
            service = self._get_service()
            
            request = service.search().list(
                part='snippet',
                q=query,
                type='channel',
                maxResults=max_results,
                order='relevance'
            )
            response = request.execute()
            
            channels = []
            for item in response.get('items', []):
                channel_info = {
                    'channel_id': item['snippet']['channelId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'published_at': item['snippet']['publishedAt'],
                    'thumbnails': item['snippet'].get('thumbnails', {}),
                    'channel_url': f"https://www.youtube.com/channel/{item['snippet']['channelId']}"
                }
                channels.append(channel_info)
            
            return {
                'success': True,
                'message': f'Found {len(channels)} channels',
                'data': {
                    'channels': channels,
                    'total_results': response.get('pageInfo', {}).get('totalResults', 0),
                    'next_page_token': response.get('nextPageToken')
                }
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error searching channels: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }
    
    async def get_video_categories(self, region: str = 'KR') -> Dict[str, Any]:
        """
        YouTube 비디오 카테고리 목록을 조회합니다.
        
        Args:
            region: 지역 코드 (KR, US 등)
        
        Returns:
            비디오 카테고리 목록
        """
        try:
            service = self._get_service()
            
            request = service.videoCategories().list(
                part='snippet',
                regionCode=region
            )
            response = request.execute()
            
            categories = []
            for item in response.get('items', []):
                category_info = {
                    'category_id': item.get('id'),
                    'title': item['snippet'].get('title'),
                    'assignable': item['snippet'].get('assignable', True),
                    'channel_id': item['snippet'].get('channelId')
                }
                categories.append(category_info)
            
            return {
                'success': True,
                'message': f'Retrieved {len(categories)} video categories',
                'data': {
                    'categories': categories,
                    'region': region
                }
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error getting video categories: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }

    async def search_channels_by_topic(self, topic_keywords: List[str], max_results: int = 25, region: str = 'KR') -> Dict[str, Any]:
        """
        주제 키워드로 채널을 검색합니다.
        
        Args:
            topic_keywords: 검색할 주제 키워드 리스트
            max_results: 최대 결과 수
            region: 지역 코드
        
        Returns:
            검색된 채널 목록
        """
        try:
            service = self._get_service()
            
            # 키워드를 조합해서 검색 쿼리 생성
            search_query = ' OR '.join(topic_keywords) if len(topic_keywords) > 1 else topic_keywords[0]
            
            request = service.search().list(
                part='snippet',
                q=search_query,
                type='channel',
                maxResults=max_results,
                order='relevance',
                regionCode=region
            )
            response = request.execute()
            
            channels = []
            for item in response.get('items', []):
                channel_info = {
                    'channel_id': item['snippet']['channelId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'published_at': item['snippet']['publishedAt'],
                    'thumbnails': item['snippet'].get('thumbnails', {}),
                    'channel_url': f"https://www.youtube.com/channel/{item['snippet']['channelId']}"
                }
                channels.append(channel_info)
            
            return {
                'success': True,
                'message': f'Found {len(channels)} channels for topics: {", ".join(topic_keywords)}',
                'data': {
                    'channels': channels,
                    'search_keywords': topic_keywords,
                    'total_results': response.get('pageInfo', {}).get('totalResults', 0),
                    'next_page_token': response.get('nextPageToken')
                }
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            return {
                'success': False,
                'message': f'YouTube API Error: {e.error_details[0]["message"] if e.error_details else str(e)}',
                'data': None
            }
        except Exception as e:
            logger.error(f"Error searching channels by topic: {str(e)}")
            return {
                'success': False,
                'message': f'Internal error: {str(e)}',
                'data': None
            }

    async def test_api_connection(self) -> Dict[str, Any]:
        """API 연결을 테스트합니다."""
        try:
            service = self._get_service()
            
            # 간단한 API 호출로 연결 테스트
            request = service.channels().list(
                part='snippet',
                mine=False,
                maxResults=1
            )
            
            # API 키가 유효한지 확인
            test_request = service.search().list(
                part='snippet',
                q='test',
                type='video',
                maxResults=1
            )
            test_request.execute()
            
            return {
                'success': True,
                'message': 'YouTube Data API connection successful',
                'api_key_status': 'valid'
            }
            
        except HttpError as e:
            if e.resp.status == 403:
                return {
                    'success': False,
                    'message': 'API key is invalid or quota exceeded',
                    'api_key_status': 'invalid'
                }
            else:
                return {
                    'success': False,
                    'message': f'YouTube API Error: {str(e)}',
                    'api_key_status': 'unknown'
                }
        except Exception as e:
            logger.error(f"Error testing API connection: {str(e)}")
            return {
                'success': False,
                'message': f'Connection test failed: {str(e)}',
                'api_key_status': 'unknown'
            }