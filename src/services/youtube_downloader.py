from youtube_comment_downloader import YoutubeCommentDownloader
from typing import List, Dict, Optional, Union
import logging
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class YouTubeCommentDownloaderService:
    def __init__(self):
        self.downloader = YoutubeCommentDownloader()
        self.executor = ThreadPoolExecutor(max_workers=4)

    async def download_comments(
        self, 
        video_url: str, 
        limit: Optional[int] = None,
        language: str = 'ko',
        sort_by: str = 'top'
    ) -> List[Dict]:
        """
        YouTube 영상의 댓글을 다운로드합니다.
        
        Args:
            video_url: YouTube 영상 URL 또는 비디오 ID
            limit: 다운로드할 댓글 수 제한 (None이면 모든 댓글)
            language: 댓글 언어 필터
            sort_by: 정렬 방식 ('top', 'new')
        
        Returns:
            댓글 리스트
        """
        try:
            video_id = self._extract_video_id(video_url)
            if not video_id:
                raise ValueError("Invalid YouTube URL or video ID")

            loop = asyncio.get_event_loop()
            comments = await loop.run_in_executor(
                self.executor,
                self._download_comments_sync,
                video_id,
                limit,
                language,
                sort_by
            )
            
            return comments
        except Exception as e:
            logger.error(f"Error downloading comments: {str(e)}")
            raise

    def _download_comments_sync(
        self, 
        video_id: str, 
        limit: Optional[int],
        language: str,
        sort_by: str
    ) -> List[Dict]:
        """동기 방식으로 댓글 다운로드"""
        comments = []
        
        try:
            comment_generator = self.downloader.get_comments_from_url(
                f"https://www.youtube.com/watch?v={video_id}",
                sort_by=0 if sort_by == 'top' else 1,
                language=language
            )
            
            for comment in comment_generator:
                processed_comment = self._process_comment(comment)
                comments.append(processed_comment)
                
                if limit and len(comments) >= limit:
                    break
                    
        except Exception as e:
            logger.error(f"Error in sync download: {str(e)}")
            raise
            
        return comments

    def _process_comment(self, comment: Dict) -> Dict:
        """댓글 데이터를 처리하고 정리합니다."""
        # timestamp 처리
        timestamp = comment.get('time_parsed')
        if isinstance(timestamp, (int, float)):
            from datetime import datetime
            timestamp = datetime.fromtimestamp(timestamp).isoformat()
        elif timestamp is None:
            timestamp = ""
        else:
            timestamp = str(timestamp)
        
        # like_count 처리 (한글 숫자 변환)
        like_count = comment.get('votes', 0)
        if isinstance(like_count, str):
            # '6.3만' 같은 형식을 숫자로 변환
            like_count = self._parse_korean_number(like_count)
        elif like_count is None:
            like_count = 0
        
        return {
            'comment_id': str(comment.get('cid', '')),
            'text': str(comment.get('text', '')),
            'author': str(comment.get('author', '')),
            'author_id': str(comment.get('channel', '')),
            'timestamp': timestamp,
            'like_count': int(like_count),
            'reply_count': int(comment.get('reply_count', 0)),
            'is_favorited': bool(comment.get('heart', False)),
            'is_reply': comment.get('parent') is not None,
            'parent_id': str(comment.get('parent', '')) if comment.get('parent') else None,
            'raw_data': comment
        }
    
    def _parse_korean_number(self, number_str: str) -> int:
        """한글 숫자 표기를 정수로 변환"""
        if not isinstance(number_str, str):
            return 0
        
        try:
            # 기본적으로 숫자인 경우
            return int(number_str)
        except:
            pass
        
        try:
            # 한글 단위 처리
            number_str = number_str.replace(',', '').strip()
            
            if '만' in number_str:
                # '6.3만' -> 63000
                base = number_str.replace('만', '')
                return int(float(base) * 10000)
            elif '천' in number_str:
                # '1.5천' -> 1500
                base = number_str.replace('천', '')
                return int(float(base) * 1000)
            elif 'K' in number_str.upper():
                # '1.5K' -> 1500
                base = number_str.upper().replace('K', '')
                return int(float(base) * 1000)
            elif 'M' in number_str.upper():
                # '1.5M' -> 1500000
                base = number_str.upper().replace('M', '')
                return int(float(base) * 1000000)
            else:
                # 그 외의 경우 0 반환
                return 0
        except:
            return 0

    def _extract_video_id(self, url: str) -> Optional[str]:
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

    async def get_video_info(self, video_url: str) -> Dict:
        """비디오 기본 정보를 가져옵니다."""
        try:
            video_id = self._extract_video_id(video_url)
            if not video_id:
                raise ValueError("Invalid YouTube URL or video ID")
            
            # 첫 번째 댓글을 가져와서 비디오 정보 추출
            loop = asyncio.get_event_loop()
            first_comment = await loop.run_in_executor(
                self.executor,
                self._get_first_comment,
                video_id
            )
            
            return {
                'video_id': video_id,
                'video_url': f"https://www.youtube.com/watch?v={video_id}",
                'has_comments': first_comment is not None
            }
            
        except Exception as e:
            logger.error(f"Error getting video info: {str(e)}")
            raise

    def _get_first_comment(self, video_id: str) -> Optional[Dict]:
        """첫 번째 댓글을 가져옵니다."""
        try:
            comment_generator = self.downloader.get_comments_from_url(
                f"https://www.youtube.com/watch?v={video_id}",
                sort_by=0
            )
            
            for comment in comment_generator:
                return comment
                
        except Exception:
            pass
            
        return None

    async def search_comments(
        self, 
        video_url: str, 
        search_term: str,
        case_sensitive: bool = False
    ) -> List[Dict]:
        """특정 키워드를 포함한 댓글을 검색합니다."""
        try:
            all_comments = await self.download_comments(video_url)
            
            if not case_sensitive:
                search_term = search_term.lower()
            
            filtered_comments = []
            for comment in all_comments:
                text = comment['text']
                if not case_sensitive:
                    text = text.lower()
                    
                if search_term in text:
                    filtered_comments.append(comment)
            
            return filtered_comments
            
        except Exception as e:
            logger.error(f"Error searching comments: {str(e)}")
            raise