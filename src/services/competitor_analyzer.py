from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
from src.services.youtube_data_api import YouTubeDataAPIService

logger = logging.getLogger(__name__)

class CompetitorAnalyzer:
    """경쟁사 분석 서비스 클래스"""
    
    def __init__(self):
        self.youtube_service = YouTubeDataAPIService()
    
    async def analyze_competitors(self, 
                                target_channel_id: str,
                                competitor_urls: List[str],
                                analysis_period: str = "30d") -> Dict[str, Any]:
        """
        경쟁사 분석을 수행합니다.
        
        Args:
            target_channel_id: 분석 대상 채널 ID
            competitor_urls: 경쟁사 채널 URL 목록
            analysis_period: 분석 기간 (7d, 30d, 90d)
            
        Returns:
            경쟁사 분석 결과
        """
        try:
            logger.info(f"Starting competitor analysis for channel: {target_channel_id}")
            
            # 1단계: 대상 채널 정보 조회
            target_channel_info = await self.youtube_service.get_channel_info(channel_id=target_channel_id)
            
            if not target_channel_info.get('success'):
                return {
                    'success': False,
                    'message': '대상 채널을 찾을 수 없습니다.',
                    'data': None
                }
            
            target_data = target_channel_info['data']
            
            # 2단계: 경쟁사 URL에서 채널 정보 수집
            competitors = await self._get_competitors_from_urls(competitor_urls)
            
            # 4단계: 각 경쟁사의 상세 분석
            competitor_analyses = []
            for competitor in competitors:
                analysis = await self._analyze_single_competitor(
                    target_data=target_data,
                    competitor_data=competitor,
                    analysis_period=analysis_period
                )
                if analysis:
                    competitor_analyses.append(analysis)
            
            # 5단계: 전략적 제안 생성
            strategic_recommendations = self._generate_strategic_recommendations(
                target_data=target_data,
                competitor_analyses=competitor_analyses
            )
            
            # 6단계: 종합 인사이트 생성
            market_insights = self._generate_market_insights(
                target_data=target_data,
                competitor_analyses=competitor_analyses
            )
            
            logger.info(f"Competitor analysis completed for {target_channel_id}. Found {len(competitor_analyses)} competitors")
            
            return {
                'success': True,
                'message': f'{len(competitor_analyses)}개의 경쟁 채널 분석이 완료되었습니다.',
                'data': {
                    'target_channel': {
                        'channel_id': target_data['channel_id'],
                        'title': target_data['title'],
                        'subscriber_count': target_data['statistics']['subscriber_count'],
                        'video_count': target_data['statistics']['video_count'],
                        'view_count': target_data['statistics']['view_count'],
                        'topic_categories': target_data.get('topic_details', {}).get('topic_categories', [])
                    },
                    'competitors': competitor_analyses,
                    'strategic_recommendations': strategic_recommendations,
                    'market_insights': market_insights,
                    'analysis_metadata': {
                        'analysis_period': analysis_period,
                        'analyzed_at': datetime.now().isoformat(),
                        'total_competitors_found': len(competitor_analyses)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Competitor analysis failed for {target_channel_id}: {str(e)}")
            return {
                'success': False,
                'message': f'경쟁사 분석 중 오류가 발생했습니다: {str(e)}',
                'data': None
            }
    
    async def _get_competitors_from_urls(self, competitor_urls: List[str]) -> List[Dict[str, Any]]:
        """경쟁사 URL 목록에서 채널 정보를 가져옵니다."""
        competitors = []
        
        for url in competitor_urls:
            try:
                # URL에서 채널 정보 추출
                channel_info = await self.youtube_service.get_channel_info(url=url)
                
                if channel_info.get('success') and channel_info.get('data'):
                    competitors.append(channel_info['data'])
                else:
                    logger.warning(f"Failed to get channel info for URL: {url}")
                    
            except Exception as e:
                logger.error(f"Error processing competitor URL {url}: {str(e)}")
                continue
        
        return competitors
    
    async def _extract_topic_keywords(self, channel_data: Dict[str, Any]) -> List[str]:
        """채널 데이터에서 주제 키워드를 추출합니다."""
        keywords = []
        
        # 채널 제목에서 키워드 추출
        title = channel_data.get('title', '')
        title_keywords = self._extract_keywords_from_text(title)
        keywords.extend(title_keywords)
        
        # 채널 설명에서 키워드 추출
        description = channel_data.get('description', '')
        desc_keywords = self._extract_keywords_from_text(description)
        keywords.extend(desc_keywords[:5])  # 상위 5개만
        
        # 브랜딩 키워드 추출
        branding_keywords = channel_data.get('branding', {}).get('keywords', '')
        if branding_keywords:
            brand_keywords = [kw.strip() for kw in branding_keywords.split(',')]
            keywords.extend(brand_keywords[:3])  # 상위 3개만
        
        # topicCategories에서 키워드 추출
        topic_categories = channel_data.get('topic_details', {}).get('topic_categories', [])
        for topic_url in topic_categories:
            topic_keyword = self._extract_keyword_from_wikipedia_url(topic_url)
            if topic_keyword:
                keywords.append(topic_keyword)
        
        # 중복 제거 및 상위 키워드만 반환
        unique_keywords = list(dict.fromkeys(keywords))  # 순서 유지하며 중복 제거
        return unique_keywords[:8]  # 최대 8개 키워드
    
    def _extract_keywords_from_text(self, text: str) -> List[str]:
        """텍스트에서 키워드를 추출합니다."""
        if not text:
            return []
        
        # 간단한 키워드 추출 로직 (실제로는 더 정교한 NLP 사용 가능)
        common_words = {'채널', '구독', '좋아요', '댓글', '영상', '비디오', 'channel', 'subscribe', 'like', 'comment', 'video'}
        
        words = text.lower().split()
        keywords = []
        
        for word in words:
            # 특수문자 제거
            clean_word = ''.join(c for c in word if c.isalnum() or c in '가-힣')
            # 길이 체크 및 일반적인 단어 제외
            if len(clean_word) >= 2 and clean_word not in common_words:
                keywords.append(clean_word)
        
        return keywords[:5]  # 상위 5개만
    
    def _extract_keyword_from_wikipedia_url(self, url: str) -> Optional[str]:
        """Wikipedia URL에서 키워드를 추출합니다."""
        try:
            # URL에서 마지막 부분 추출 (예: "Video_game" -> "게임")
            keyword = url.split('/')[-1].replace('_', ' ')
            
            # 영어 키워드를 한국어로 변환 (간단한 매핑)
            keyword_mapping = {
                'Video game': '게임',
                'Music': '음악',
                'Entertainment': '엔터테인먼트',
                'Education': '교육',
                'Technology': '기술',
                'Sports': '스포츠',
                'Comedy': '코미디',
                'Gaming': '게임',
                'Film': '영화',
                'Television': 'TV'
            }
            
            return keyword_mapping.get(keyword, keyword.lower())
        except:
            return None
    
    async def _find_similar_channels(self, 
                                   target_data: Dict[str, Any],
                                   topic_keywords: List[str],
                                   max_results: int) -> List[Dict[str, Any]]:
        """유사한 채널들을 검색합니다."""
        try:
            # 키워드로 채널 검색
            search_result = await self.youtube_service.search_channels_by_topic(
                topic_keywords=topic_keywords,
                max_results=max_results * 2,  # 더 많이 검색해서 필터링
                region='KR'
            )
            
            if not search_result.get('success'):
                return []
            
            channels = search_result['data']['channels']
            target_channel_id = target_data['channel_id']
            
            # 대상 채널 제외
            filtered_channels = [ch for ch in channels if ch['channel_id'] != target_channel_id]
            
            # 각 채널의 상세 정보 조회
            detailed_channels = []
            for channel in filtered_channels[:max_results]:
                channel_info = await self.youtube_service.get_channel_info(channel_id=channel['channel_id'])
                if channel_info.get('success'):
                    detailed_channels.append(channel_info['data'])
            
            return detailed_channels
            
        except Exception as e:
            logger.error(f"Error finding similar channels: {str(e)}")
            return []
    
    async def _analyze_single_competitor(self, 
                                       target_data: Dict[str, Any],
                                       competitor_data: Dict[str, Any],
                                       analysis_period: str) -> Optional[Dict[str, Any]]:
        """단일 경쟁사를 분석합니다."""
        try:
            # 기본 성과 비교
            performance_comparison = self._calculate_performance_comparison(target_data, competitor_data)
            
            # 채널 유사도 계산
            similarity_score = self._calculate_channel_similarity(target_data, competitor_data)
            
            # 경쟁사의 최근 비디오 분석
            recent_videos = await self.youtube_service.get_channel_videos(
                channel_id=competitor_data['channel_id'],
                max_results=20,
                order='date'
            )
            
            content_insights = {}
            if recent_videos.get('success'):
                content_insights = self._analyze_content_strategy(recent_videos['data']['videos'])
            
            return {
                'channel_id': competitor_data['channel_id'],
                'title': competitor_data['title'],
                'similarity_score': similarity_score,
                'performance_comparison': performance_comparison,
                'content_insights': content_insights,
                'channel_stats': {
                    'subscriber_count': competitor_data['statistics']['subscriber_count'],
                    'view_count': competitor_data['statistics']['view_count'],
                    'video_count': competitor_data['statistics']['video_count']
                }
            }
            
        except Exception as e:
            logger.error(f"Error analyzing competitor {competitor_data.get('channel_id', 'unknown')}: {str(e)}")
            return None
    
    def _calculate_performance_comparison(self, target_data: Dict[str, Any], competitor_data: Dict[str, Any]) -> Dict[str, Any]:
        """성과 비교를 계산합니다."""
        target_stats = target_data['statistics']
        competitor_stats = competitor_data['statistics']
        
        # 안전한 나눗셈을 위한 함수
        def safe_ratio(a, b):
            return a / b if b > 0 else 0
        
        return {
            'subscriber_ratio': safe_ratio(competitor_stats['subscriber_count'], target_stats['subscriber_count']),
            'view_ratio': safe_ratio(competitor_stats['view_count'], target_stats['view_count']),
            'video_ratio': safe_ratio(competitor_stats['video_count'], target_stats['video_count']),
            'avg_views_per_video_ratio': safe_ratio(
                safe_ratio(competitor_stats['view_count'], competitor_stats['video_count']),
                safe_ratio(target_stats['view_count'], target_stats['video_count'])
            )
        }
    
    def _calculate_channel_similarity(self, target_data: Dict[str, Any], competitor_data: Dict[str, Any]) -> float:
        """채널 유사도를 계산합니다."""
        similarity_score = 0.0
        
        # 주제 카테고리 유사도 (50% 가중치)
        target_topics = set(target_data.get('topic_details', {}).get('topic_categories', []))
        competitor_topics = set(competitor_data.get('topic_details', {}).get('topic_categories', []))
        
        if target_topics and competitor_topics:
            topic_overlap = len(target_topics.intersection(competitor_topics))
            topic_union = len(target_topics.union(competitor_topics))
            topic_similarity = topic_overlap / topic_union if topic_union > 0 else 0
            similarity_score += topic_similarity * 0.5
        
        # 키워드 유사도 (30% 가중치)
        target_keywords = set(self._extract_keywords_from_text(
            f"{target_data.get('title', '')} {target_data.get('description', '')}"
        ))
        competitor_keywords = set(self._extract_keywords_from_text(
            f"{competitor_data.get('title', '')} {competitor_data.get('description', '')}"
        ))
        
        if target_keywords and competitor_keywords:
            keyword_overlap = len(target_keywords.intersection(competitor_keywords))
            keyword_union = len(target_keywords.union(competitor_keywords))
            keyword_similarity = keyword_overlap / keyword_union if keyword_union > 0 else 0
            similarity_score += keyword_similarity * 0.3
        
        # 규모 유사도 (20% 가중치)
        target_subs = target_data['statistics']['subscriber_count']
        competitor_subs = competitor_data['statistics']['subscriber_count']
        
        if target_subs > 0 and competitor_subs > 0:
            size_ratio = min(target_subs, competitor_subs) / max(target_subs, competitor_subs)
            similarity_score += size_ratio * 0.2
        
        return min(similarity_score, 1.0)  # 최대 1.0으로 제한
    
    def _analyze_content_strategy(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """콘텐츠 전략을 분석합니다."""
        if not videos:
            return {}
        
        # 제목 패턴 분석
        title_patterns = []
        total_length = 0
        
        for video in videos:
            title = video.get('title', '')
            total_length += len(title)
            
            # 특수문자 사용 패턴
            if any(char in title for char in ['✨', '🔥', '❤️', '💎', '⭐']):
                title_patterns.append('이모지 사용')
            if '!' in title or '?' in title:
                title_patterns.append('감정 표현')
            if any(word in title.upper() for word in ['NEW', '신작', '최신', '업데이트']):
                title_patterns.append('신규성 강조')
        
        avg_title_length = total_length / len(videos) if videos else 0
        
        # 업로드 패턴 분석
        upload_pattern = self._analyze_upload_pattern(videos)
        
        return {
            'avg_title_length': round(avg_title_length, 1),
            'common_title_patterns': list(set(title_patterns)),
            'upload_pattern': upload_pattern,
            'recent_video_count': len(videos)
        }
    
    def _analyze_upload_pattern(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """업로드 패턴을 분석합니다."""
        if not videos:
            return {}
        
        upload_days = []
        upload_hours = []
        
        for video in videos:
            published_at = video.get('published_at')
            if published_at:
                try:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    upload_days.append(dt.strftime('%A'))
                    upload_hours.append(dt.hour)
                except:
                    continue
        
        # 가장 빈번한 업로드 요일과 시간
        most_common_day = max(set(upload_days), key=upload_days.count) if upload_days else None
        avg_hour = sum(upload_hours) / len(upload_hours) if upload_hours else None
        
        return {
            'most_common_upload_day': most_common_day,
            'avg_upload_hour': round(avg_hour, 1) if avg_hour else None,
            'upload_frequency': f"최근 {len(videos)}개 영상"
        }
    
    def _generate_strategic_recommendations(self, 
                                          target_data: Dict[str, Any],
                                          competitor_analyses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """전략적 제안을 생성합니다."""
        recommendations = []
        
        if not competitor_analyses:
            return recommendations
        
        # 성과 분석을 위한 데이터 수집
        better_performers = [comp for comp in competitor_analyses 
                           if comp['performance_comparison']['subscriber_ratio'] > 1.2]
        
        if better_performers:
            # 구독자 수가 더 많은 경쟁사의 공통 패턴 분석
            common_patterns = []
            
            for comp in better_performers:
                patterns = comp.get('content_insights', {}).get('common_title_patterns', [])
                common_patterns.extend(patterns)
            
            if common_patterns:
                most_common = max(set(common_patterns), key=common_patterns.count)
                recommendations.append({
                    'priority': 'high',
                    'type': 'content_strategy',
                    'suggestion': f'상위 경쟁사들이 자주 사용하는 "{most_common}" 패턴 활용 권장',
                    'impact': 'subscriber_growth'
                })
        
        # 업로드 빈도 분석
        target_video_count = target_data['statistics']['video_count']
        avg_competitor_videos = sum(comp['channel_stats']['video_count'] 
                                  for comp in competitor_analyses) / len(competitor_analyses)
        
        if avg_competitor_videos > target_video_count * 1.5:
            recommendations.append({
                'priority': 'medium',
                'type': 'upload_frequency',
                'suggestion': f'경쟁사 평균 대비 업로드 빈도 증가 필요 (현재: {target_video_count}개, 평균: {int(avg_competitor_videos)}개)',
                'impact': 'visibility'
            })
        
        # 제목 길이 분석
        avg_title_lengths = [comp.get('content_insights', {}).get('avg_title_length', 0) 
                           for comp in competitor_analyses if comp.get('content_insights', {}).get('avg_title_length')]
        
        if avg_title_lengths:
            optimal_length = sum(avg_title_lengths) / len(avg_title_lengths)
            recommendations.append({
                'priority': 'low',
                'type': 'title_optimization',
                'suggestion': f'제목 길이 최적화 권장 (권장 길이: {int(optimal_length)}자)',
                'impact': 'click_through_rate'
            })
        
        return recommendations
    
    def _generate_market_insights(self, 
                                target_data: Dict[str, Any],
                                competitor_analyses: List[Dict[str, Any]]) -> Dict[str, Any]:
        """시장 인사이트를 생성합니다."""
        if not competitor_analyses:
            return {
                'market_position': 'unknown',
                'total_competitors_analyzed': 0,
                'growth_opportunities': ['경쟁사 데이터 부족으로 분석 불가'],
                'market_avg_subscribers': 0,
                'competitive_advantage': '분석 대상 경쟁사 없음'
            }
        
        # 시장 위치 분석
        target_subs = target_data['statistics']['subscriber_count']
        competitor_subs = [comp['channel_stats']['subscriber_count'] for comp in competitor_analyses]
        
        market_position = 'top'
        better_count = sum(1 for subs in competitor_subs if subs > target_subs)
        
        if better_count > len(competitor_subs) * 0.7:
            market_position = 'bottom'
        elif better_count > len(competitor_subs) * 0.3:
            market_position = 'middle'
        
        # 성장 기회 분석
        growth_opportunities = []
        
        # 평균 조회수 분석
        target_avg_views = target_data['statistics']['view_count'] / max(target_data['statistics']['video_count'], 1)
        competitor_avg_views = []
        
        for comp in competitor_analyses:
            comp_stats = comp['channel_stats']
            comp_avg = comp_stats['view_count'] / max(comp_stats['video_count'], 1)
            competitor_avg_views.append(comp_avg)
        
        if competitor_avg_views:
            market_avg_views = sum(competitor_avg_views) / len(competitor_avg_views)
            if market_avg_views > target_avg_views * 1.5:
                growth_opportunities.append('평균 조회수 개선 여지 큼')
        
        return {
            'market_position': market_position,
            'total_competitors_analyzed': len(competitor_analyses),
            'growth_opportunities': growth_opportunities,
            'market_avg_subscribers': int(sum(competitor_subs) / len(competitor_subs)) if competitor_subs else 0,
            'competitive_advantage': '분석된 경쟁사 중 상위권' if market_position == 'top' else '성장 가능성 높음'
        }