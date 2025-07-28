"""YouTube Comment Management Service"""

import httpx
from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class YouTubeCommentService:
    """YouTube Data API를 통한 댓글 관리 서비스"""
    
    def __init__(self):
        self.base_url = "https://www.googleapis.com/youtube/v3"
    
    async def get_video_comments(
        self,
        access_token: str,
        video_id: str,
        max_results: int = 100,
        order: str = "time"
    ) -> Dict[str, Any]:
        """
        비디오 댓글 목록 조회
        
        Args:
            access_token: OAuth 액세스 토큰
            video_id: 비디오 ID
            max_results: 최대 결과 수 (기본값: 100)
            order: 정렬 순서 (time, relevance)
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            params = {
                'part': 'snippet,replies',
                'videoId': video_id,
                'maxResults': max_results,
                'order': order
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/commentThreads",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._process_comments_data(data)
                else:
                    logger.error(f"댓글 조회 실패: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'댓글 조회 실패: {response.status_code}',
                        'data': None
                    }
                    
        except Exception as e:
            logger.error(f"댓글 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'댓글 조회 실패: {str(e)}',
                'data': None
            }
    
    async def get_channel_comments(
        self,
        access_token: str,
        channel_id: str,
        max_results: int = 100
    ) -> Dict[str, Any]:
        """
        채널의 모든 댓글 조회 (채널 소유자만 가능)
        
        Args:
            access_token: OAuth 액세스 토큰
            channel_id: 채널 ID
            max_results: 최대 결과 수
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            params = {
                'part': 'snippet,replies',
                'allThreadsRelatedToChannelId': channel_id,
                'maxResults': max_results,
                'order': 'time'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/commentThreads",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    return self._process_comments_data(data)
                else:
                    logger.error(f"채널 댓글 조회 실패: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'채널 댓글 조회 실패: {response.status_code}',
                        'data': None
                    }
                    
        except Exception as e:
            logger.error(f"채널 댓글 조회 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'채널 댓글 조회 실패: {str(e)}',
                'data': None
            }
    
    async def delete_comment(
        self,
        access_token: str,
        comment_id: str
    ) -> Dict[str, Any]:
        """
        댓글 삭제
        
        Args:
            access_token: OAuth 액세스 토큰
            comment_id: 삭제할 댓글 ID
        """
        try:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Accept': 'application/json'
            }
            
            params = {
                'id': comment_id
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.delete(
                    f"{self.base_url}/comments",
                    headers=headers,
                    params=params,
                    timeout=30.0
                )
                
                if response.status_code == 204:
                    logger.info(f"댓글 삭제 성공: {comment_id}")
                    return {
                        'success': True,
                        'message': '댓글이 성공적으로 삭제되었습니다.',
                        'comment_id': comment_id
                    }
                else:
                    logger.error(f"댓글 삭제 실패: {response.status_code} - {response.text}")
                    return {
                        'success': False,
                        'message': f'댓글 삭제 실패: {response.status_code}',
                        'comment_id': comment_id
                    }
                    
        except Exception as e:
            logger.error(f"댓글 삭제 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'댓글 삭제 실패: {str(e)}',
                'comment_id': comment_id
            }
    
    async def delete_multiple_comments(
        self,
        access_token: str,
        comment_ids: List[str]
    ) -> Dict[str, Any]:
        """
        여러 댓글 일괄 삭제
        
        Args:
            access_token: OAuth 액세스 토큰
            comment_ids: 삭제할 댓글 ID 목록
        """
        try:
            results = []
            success_count = 0
            fail_count = 0
            
            for comment_id in comment_ids:
                result = await self.delete_comment(access_token, comment_id)
                results.append(result)
                
                if result['success']:
                    success_count += 1
                else:
                    fail_count += 1
            
            return {
                'success': True,
                'message': f'일괄 삭제 완료: 성공 {success_count}개, 실패 {fail_count}개',
                'results': results,
                'success_count': success_count,
                'fail_count': fail_count
            }
            
        except Exception as e:
            logger.error(f"일괄 댓글 삭제 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'일괄 댓글 삭제 실패: {str(e)}',
                'results': []
            }
    
    async def detect_spam_comments(
        self,
        access_token: str,
        video_id: str,
        spam_keywords: List[str] = None
    ) -> Dict[str, Any]:
        """
        스팸 댓글 탐지
        
        Args:
            access_token: OAuth 액세스 토큰
            video_id: 비디오 ID
            spam_keywords: 스팸 키워드 목록
        """
        try:
            # 기본 스팸 키워드 설정
            if spam_keywords is None:
                spam_keywords = [
                    '구독', '좋아요', '팔로우', '구독하고', '좋아요하고',
                    '무료', '이벤트', '당첨', '추천', '링크',
                    '홈페이지', '사이트', '방문', '클릭',
                    '광고', '홍보', '마케팅', '판매'
                ]
            
            # 비디오 댓글 조회
            comments_result = await self.get_video_comments(access_token, video_id)
            
            if not comments_result['success']:
                return comments_result
            
            comments = comments_result['data']['comments']
            spam_comments = []
            
            for comment in comments:
                comment_text = comment['snippet']['textDisplay'].lower()
                
                # 스팸 키워드 검사
                spam_score = 0
                detected_keywords = []
                
                for keyword in spam_keywords:
                    if keyword in comment_text:
                        spam_score += 1
                        detected_keywords.append(keyword)
                
                # 스팸 판정 기준 (키워드 2개 이상)
                if spam_score >= 2:
                    spam_comments.append({
                        'comment_id': comment['id'],
                        'author': comment['snippet']['authorDisplayName'],
                        'text': comment['snippet']['textDisplay'],
                        'spam_score': spam_score,
                        'detected_keywords': detected_keywords,
                        'published_at': comment['snippet']['publishedAt']
                    })
            
            return {
                'success': True,
                'message': f'스팸 댓글 탐지 완료: {len(spam_comments)}개 발견',
                'data': {
                    'spam_comments': spam_comments,
                    'total_comments': len(comments),
                    'spam_count': len(spam_comments),
                    'spam_percentage': round((len(spam_comments) / len(comments)) * 100, 2) if comments else 0
                }
            }
            
        except Exception as e:
            logger.error(f"스팸 댓글 탐지 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'스팸 댓글 탐지 실패: {str(e)}',
                'data': None
            }
    
    def _process_comments_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """댓글 데이터 처리"""
        try:
            comments = []
            
            for item in data.get('items', []):
                comment = item['snippet']['topLevelComment']
                
                # 대댓글 처리
                replies = []
                if 'replies' in item:
                    for reply in item['replies']['comments']:
                        replies.append({
                            'id': reply['id'],
                            'author': reply['snippet']['authorDisplayName'],
                            'author_channel_id': reply['snippet']['authorChannelId']['value'] if reply['snippet'].get('authorChannelId') else None,
                            'text': reply['snippet']['textDisplay'],
                            'like_count': reply['snippet']['likeCount'],
                            'published_at': reply['snippet']['publishedAt'],
                            'updated_at': reply['snippet']['updatedAt'],
                            'parent_id': reply['snippet']['parentId']
                        })
                
                comments.append({
                    'id': comment['id'],
                    'author': comment['snippet']['authorDisplayName'],
                    'author_channel_id': comment['snippet']['authorChannelId']['value'] if comment['snippet'].get('authorChannelId') else None,
                    'text': comment['snippet']['textDisplay'],
                    'like_count': comment['snippet']['likeCount'],
                    'reply_count': item['snippet']['totalReplyCount'],
                    'published_at': comment['snippet']['publishedAt'],
                    'updated_at': comment['snippet']['updatedAt'],
                    'video_id': comment['snippet']['videoId'],
                    'replies': replies,
                    'snippet': comment['snippet']
                })
            
            return {
                'success': True,
                'message': f'{len(comments)}개 댓글 조회 완료',
                'data': {
                    'comments': comments,
                    'total_results': data.get('pageInfo', {}).get('totalResults', 0),
                    'results_per_page': data.get('pageInfo', {}).get('resultsPerPage', 0),
                    'next_page_token': data.get('nextPageToken'),
                    'prev_page_token': data.get('prevPageToken')
                }
            }
            
        except Exception as e:
            logger.error(f"댓글 데이터 처리 중 오류: {str(e)}")
            return {
                'success': False,
                'message': f'댓글 데이터 처리 실패: {str(e)}',
                'data': None
            }