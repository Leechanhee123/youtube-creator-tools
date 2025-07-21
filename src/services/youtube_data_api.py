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
        
        # Debug: API 키 상태 로깅 (보안을 위해 일부만 표시)
        if self.api_key:
            masked_key = f"{self.api_key[:10]}...{self.api_key[-4:]}" if len(self.api_key) > 14 else "***"
            logger.info(f"YouTube API Key loaded: {masked_key}")
        else:
            logger.error(f"YouTube API Key not found. Environment variable YOUTUBE_API_KEY = {repr(settings.YOUTUBE_API_KEY)}")
    
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
            max_results: 최대 결과 수 (자동으로 50개씩 페이지네이션 처리)
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
            
            videos = []
            video_ids = []
            all_videos = []
            current_page_token = page_token
            videos_fetched = 0
            
            # 페이지네이션을 통해 필요한 만큼 비디오 가져오기
            while videos_fetched < max_results:
                # 현재 요청에서 가져올 비디오 수 (최대 50개)
                current_max_results = min(50, max_results - videos_fetched)
                
                params = {
                    'part': 'snippet,contentDetails',
                    'playlistId': uploads_playlist_id,
                    'maxResults': current_max_results
                }
                
                if current_page_token:
                    params['pageToken'] = current_page_token
                    
                playlist_response = service.playlistItems().list(**params).execute()
                items = playlist_response.get('items', [])
                
                if not items:
                    break  # 더 이상 비디오가 없음
                
                # 비디오 기본 정보 수집
                for item in items:
                    video_info = self._process_video_data(item)
                    videos.append(video_info)
                    video_ids.append(video_info['video_id'])
                
                videos_fetched += len(items)
                current_page_token = playlist_response.get('nextPageToken')
                
                # 다음 페이지가 없거나 요청된 수만큼 가져왔으면 중단
                if not current_page_token or videos_fetched >= max_results:
                    break
            
            # 비디오 ID들로 통계 정보 일괄 조회 (50개씩 배치 처리)
            stats_map = {}
            if video_ids:
                # YouTube API v3 제한: videos().list()는 최대 50개 ID만 허용
                batch_size = 50
                for i in range(0, len(video_ids), batch_size):
                    batch_video_ids = video_ids[i:i + batch_size]
                    
                    stats_response = service.videos().list(
                        part='statistics',
                        id=','.join(batch_video_ids)
                    ).execute()
                    
                    # 통계 정보를 맵에 추가
                    for stats_item in stats_response.get('items', []):
                        stats_map[stats_item['id']] = stats_item.get('statistics', {})
                
                for video in videos:
                    video_id = video['video_id']
                    if video_id in stats_map:
                        stats = stats_map[video_id]
                        video['statistics'] = {
                            'view_count': int(stats.get('viewCount', 0)),
                            'like_count': int(stats.get('likeCount', 0)),
                            'comment_count': int(stats.get('commentCount', 0))
                        }
            
            return {
                'success': True,
                'message': f'Retrieved {len(videos)} videos',
                'data': {
                    'videos': videos,
                    'total_results': len(videos),
                    'next_page_token': current_page_token
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

    async def get_video_comments(
        self, 
        video_id: str, 
        max_results: int = None,
        order: str = 'time',
        text_format: str = 'plainText'
    ) -> Dict[str, Any]:
        """
        YouTube Data API v3를 사용해서 비디오의 댓글을 수집합니다.
        
        Args:
            video_id: YouTube 비디오 ID
            max_results: 수집할 최대 댓글 수 (None이면 제한 없음)
            order: 정렬 순서 ('time', 'relevance')
            text_format: 텍스트 형식 ('plainText', 'html')
        
        Returns:
            댓글 데이터와 메타 정보
        """
        try:
            service = self._get_service()
            
            all_comments = []
            next_page_token = None
            page_count = 0
            total_quota_used = 0
            
            while True:
                # API 요청 파라미터 설정
                params = {
                    'part': 'snippet,replies',
                    'videoId': video_id,
                    'maxResults': min(100, max_results - len(all_comments) if max_results else 100),
                    'order': order,
                    'textFormat': text_format
                }
                
                if next_page_token:
                    params['pageToken'] = next_page_token
                
                # API 호출 (quota cost: 1 unit)
                request = service.commentThreads().list(**params)
                response = request.execute()
                total_quota_used += 1
                page_count += 1
                
                logger.info(f"댓글 API 호출 {page_count}페이지: {len(response.get('items', []))}개 댓글 수집됨")
                
                # 댓글 데이터 처리
                for item in response.get('items', []):
                    comment_thread = self._process_comment_thread(item)
                    all_comments.append(comment_thread)
                    
                    # 대댓글 처리 개선
                    reply_count = comment_thread.get('reply_count', 0)
                    if reply_count > 0:
                        # API 응답에 포함된 대댓글 처리 (최대 5개)
                        if 'replies' in item and item['replies'].get('comments'):
                            for reply in item['replies']['comments']:
                                reply_data = self._process_reply_comment(reply, comment_thread['comment_id'])
                                all_comments.append(reply_data)
                        
                        # 더 많은 대댓글이 있는 경우 추가로 가져오기
                        if reply_count > 5:
                            try:
                                additional_replies = await self._get_additional_replies(
                                    comment_thread['comment_id'], 
                                    max_replies=min(50, reply_count)  # 최대 50개까지
                                )
                                all_comments.extend(additional_replies)
                            except Exception as e:
                                logger.warning(f"대댓글 추가 수집 실패 (댓글 ID: {comment_thread['comment_id']}): {str(e)}")
                
                # 다음 페이지 토큰 확인
                next_page_token = response.get('nextPageToken')
                
                # 종료 조건 확인
                if not next_page_token:
                    logger.info("더 이상 댓글이 없습니다.")
                    break
                    
                if max_results and len(all_comments) >= max_results:
                    logger.info(f"목표 댓글 수 {max_results}개에 도달했습니다.")
                    break
                    
                # API 호출 간격 (rate limiting 방지)
                import asyncio
                await asyncio.sleep(0.1)
            
            # 최종 결과 정리
            if max_results:
                all_comments = all_comments[:max_results]
            
            return {
                'success': True,
                'message': f'댓글 수집 완료: {len(all_comments)}개',
                'video_id': video_id,
                'total_comments': len(all_comments),
                'comments': all_comments,
                'metadata': {
                    'pages_fetched': page_count,
                    'quota_used': total_quota_used,
                    'order': order,
                    'text_format': text_format
                }
            }
            
        except HttpError as e:
            logger.error(f"YouTube API HTTP Error: {str(e)}")
            error_message = "Unknown API error"
            
            if e.resp.status == 403:
                if "quotaExceeded" in str(e):
                    error_message = "API 할당량이 초과되었습니다."
                elif "commentsDisabled" in str(e):
                    error_message = "이 비디오는 댓글이 비활성화되어 있습니다."
                else:
                    error_message = "API 키가 유효하지 않거나 권한이 없습니다."
            elif e.resp.status == 404:
                error_message = "비디오를 찾을 수 없습니다."
            else:
                error_message = f"API 오류: {e.error_details[0]['message'] if e.error_details else str(e)}"
            
            return {
                'success': False,
                'message': error_message,
                'video_id': video_id,
                'total_comments': 0,
                'comments': [],
                'error_code': e.resp.status if hasattr(e, 'resp') else None
            }
            
        except Exception as e:
            logger.error(f"댓글 수집 중 오류 발생: {str(e)}")
            return {
                'success': False,
                'message': f'내부 오류: {str(e)}',
                'video_id': video_id,
                'total_comments': 0,
                'comments': []
            }
    
    def _process_comment_thread(self, comment_thread_item: Dict) -> Dict[str, Any]:
        """댓글 스레드 데이터를 처리합니다."""
        snippet = comment_thread_item.get('snippet', {})
        top_level_comment = snippet.get('topLevelComment', {}).get('snippet', {})
        
        return {
            'comment_id': comment_thread_item.get('id'),
            'text': top_level_comment.get('textDisplay', ''),
            'text_original': top_level_comment.get('textOriginal', ''),
            'author': top_level_comment.get('authorDisplayName', ''),
            'author_id': top_level_comment.get('authorChannelId', {}).get('value', ''),
            'author_profile_image': top_level_comment.get('authorProfileImageUrl', ''),
            'author_channel_url': top_level_comment.get('authorChannelUrl', ''),
            'like_count': int(top_level_comment.get('likeCount', 0)),
            'published_at': top_level_comment.get('publishedAt', ''),
            'updated_at': top_level_comment.get('updatedAt', ''),
            'reply_count': int(snippet.get('totalReplyCount', 0)),
            'is_reply': False,
            'parent_id': None,
            'video_id': top_level_comment.get('videoId', ''),
            'can_reply': snippet.get('canReply', True),
            'moderation_status': top_level_comment.get('moderationStatus', ''),
            'timestamp': top_level_comment.get('publishedAt', ''),
            'raw_data': comment_thread_item
        }
    
    def _process_reply_comment(self, reply_item: Dict, parent_id: str) -> Dict[str, Any]:
        """대댓글 데이터를 처리합니다."""
        snippet = reply_item.get('snippet', {})
        
        return {
            'comment_id': reply_item.get('id'),
            'text': snippet.get('textDisplay', ''),
            'text_original': snippet.get('textOriginal', ''),
            'author': snippet.get('authorDisplayName', ''),
            'author_id': snippet.get('authorChannelId', {}).get('value', ''),
            'author_profile_image': snippet.get('authorProfileImageUrl', ''),
            'author_channel_url': snippet.get('authorChannelUrl', ''),
            'like_count': int(snippet.get('likeCount', 0)),
            'published_at': snippet.get('publishedAt', ''),
            'updated_at': snippet.get('updatedAt', ''),
            'reply_count': 0,  # 대댓글은 답글이 없음
            'is_reply': True,
            'parent_id': parent_id,
            'video_id': snippet.get('videoId', ''),
            'can_reply': False,  # 대댓글에는 답글 불가
            'moderation_status': snippet.get('moderationStatus', ''),
            'timestamp': snippet.get('publishedAt', ''),
            'raw_data': reply_item
        }
    
    async def _get_additional_replies(self, parent_comment_id: str, max_replies: int = 50) -> List[Dict[str, Any]]:
        """댓글 스레드의 추가 대댓글을 가져옵니다."""
        try:
            service = self._get_service()
            all_replies = []
            next_page_token = None
            
            while len(all_replies) < max_replies:
                params = {
                    'part': 'snippet',
                    'parentId': parent_comment_id,
                    'maxResults': min(100, max_replies - len(all_replies)),
                    'textFormat': 'plainText'
                }
                
                if next_page_token:
                    params['pageToken'] = next_page_token
                
                request = service.comments().list(**params)
                response = request.execute()
                
                for reply_item in response.get('items', []):
                    reply_data = self._process_reply_comment(reply_item, parent_comment_id)
                    all_replies.append(reply_data)
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
                    
                # API 호출 간격
                import asyncio
                await asyncio.sleep(0.1)
            
            logger.info(f"댓글 {parent_comment_id}의 추가 대댓글 {len(all_replies)}개 수집됨")
            return all_replies
            
        except Exception as e:
            logger.error(f"추가 대댓글 수집 실패: {str(e)}")
            return []

    def _extract_video_id_from_url(self, url: str) -> Optional[str]:
        """YouTube URL에서 비디오 ID를 추출합니다."""
        import re
        
        # 이미 비디오 ID인 경우
        if len(url) == 11 and url.isalnum():
            return url
            
        # YouTube URL 패턴들
        patterns = [
            r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
            r'(?:embed\/)([0-9A-Za-z_-]{11})',
            r'(?:youtu\.be\/)([0-9A-Za-z_-]{11})'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
                
        return None

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