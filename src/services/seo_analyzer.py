from typing import List, Dict, Any, Optional, Tuple
import re
import statistics
from collections import Counter
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SEOAnalyzer:
    """YouTube 채널의 SEO 분석 서비스"""
    
    def __init__(self):
        # SEO 분석을 위한 한국어 키워드 패턴
        self.korean_patterns = {
            'attention_grabbing': ['꿀팁', '대박', '충격', '실화', '레전드', '최고', '완전', '진짜', '놀라운'],
            'question_words': ['어떻게', '왜', '무엇', '언제', '어디서', '누가', '방법', '비법'],
            'trending_words': ['핫', '트렌드', '인기', '유행', '신상', '최신', '요즘'],
            'emotional_words': ['감동', '눈물', '웃음', '재미', '신기', '놀라운', '감사']
        }
        
        # 영어 키워드 패턴
        self.english_patterns = {
            'attention_grabbing': ['amazing', 'incredible', 'shocking', 'unbelievable', 'best', 'ultimate', 'perfect'],
            'question_words': ['how', 'why', 'what', 'when', 'where', 'who'],
            'trending_words': ['trending', 'viral', 'popular', 'hot', 'new', 'latest'],
            'emotional_words': ['funny', 'sad', 'exciting', 'amazing', 'wonderful']
        }
    
    def analyze_channel_seo(self, videos: List[Dict[str, Any]], 
                           percentile_threshold: float = 0.2) -> Dict[str, Any]:
        """
        채널의 전체 비디오를 분석하여 SEO 개선점을 찾습니다.
        
        Args:
            videos: 비디오 정보 리스트
            percentile_threshold: 상위/하위 그룹을 나누는 기준 (0.2 = 상위/하위 20%)
        
        Returns:
            SEO 분석 결과
        """
        if not videos or len(videos) < 10:
            return {
                'success': False,
                'message': 'SEO 분석을 위해서는 최소 10개 이상의 비디오가 필요합니다.',
                'data': None
            }
        
        try:
            # 조회수 기준으로 정렬
            sorted_videos = sorted(videos, key=lambda x: x.get('statistics', {}).get('view_count', 0), reverse=True)
            
            # 상위/하위 그룹 분리
            top_count = max(1, int(len(sorted_videos) * percentile_threshold))
            bottom_count = max(1, int(len(sorted_videos) * percentile_threshold))
            
            top_videos = sorted_videos[:top_count]
            bottom_videos = sorted_videos[-bottom_count:]
            
            logger.info(f"Analyzing {len(sorted_videos)} videos: {top_count} top, {bottom_count} bottom")
            
            # 각 그룹 분석
            top_analysis = self._analyze_video_group(top_videos, "상위 조회수")
            bottom_analysis = self._analyze_video_group(bottom_videos, "하위 조회수")
            
            # 비교 분석 및 개선점 도출
            comparison = self._compare_groups(top_analysis, bottom_analysis)
            recommendations = self._generate_recommendations(comparison, top_analysis, bottom_analysis)
            
            return {
                'success': True,
                'message': f'{len(sorted_videos)}개 비디오의 SEO 분석이 완료되었습니다.',
                'data': {
                    'total_videos': len(sorted_videos),
                    'analysis_groups': {
                        'top_videos': {
                            'count': top_count,
                            'analysis': top_analysis
                        },
                        'bottom_videos': {
                            'count': bottom_count,
                            'analysis': bottom_analysis
                        }
                    },
                    'comparison': comparison,
                    'recommendations': recommendations,
                    'percentile_threshold': percentile_threshold
                }
            }
            
        except Exception as e:
            logger.error(f"SEO analysis failed: {str(e)}")
            return {
                'success': False,
                'message': f'SEO 분석 중 오류가 발생했습니다: {str(e)}',
                'data': None
            }
    
    def _analyze_video_group(self, videos: List[Dict[str, Any]], group_name: str) -> Dict[str, Any]:
        """비디오 그룹의 SEO 특성을 분석합니다."""
        
        # 기본 통계
        view_counts = [v.get('statistics', {}).get('view_count', 0) for v in videos]
        like_counts = [v.get('statistics', {}).get('like_count', 0) for v in videos]
        comment_counts = [v.get('statistics', {}).get('comment_count', 0) for v in videos]
        
        # 제목 분석
        titles = [v.get('title', '') for v in videos]
        title_analysis = self._analyze_titles(titles)
        
        # 설명 분석
        descriptions = [v.get('description', '') for v in videos]
        description_analysis = self._analyze_descriptions(descriptions)
        
        # 업로드 시간 분석
        upload_times = []
        for v in videos:
            try:
                published_at = v.get('published_at', '')
                if published_at:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    upload_times.append({
                        'hour': dt.hour,
                        'day_of_week': dt.weekday(),  # 0=월요일, 6=일요일
                        'month': dt.month
                    })
            except:
                continue
        
        time_analysis = self._analyze_upload_times(upload_times)
        
        return {
            'group_name': group_name,
            'video_count': len(videos),
            'statistics': {
                'avg_views': statistics.mean(view_counts) if view_counts else 0,
                'median_views': statistics.median(view_counts) if view_counts else 0,
                'avg_likes': statistics.mean(like_counts) if like_counts else 0,
                'avg_comments': statistics.mean(comment_counts) if comment_counts else 0,
                'total_views': sum(view_counts)
            },
            'title_analysis': title_analysis,
            'description_analysis': description_analysis,
            'upload_time_analysis': time_analysis
        }
    
    def _analyze_titles(self, titles: List[str]) -> Dict[str, Any]:
        """제목들을 분석하여 SEO 특성을 추출합니다."""
        
        if not titles:
            return {}
        
        # 기본 통계
        title_lengths = [len(title) for title in titles]
        word_counts = [len(title.split()) for title in titles]
        
        # 키워드 분석
        all_keywords = {
            'attention_grabbing': 0,
            'question_words': 0,
            'trending_words': 0,
            'emotional_words': 0
        }
        
        # 특수 문자 사용 패턴
        special_chars = {
            'exclamation': 0,  # !
            'question': 0,     # ?
            'brackets': 0,     # [ ] ( )
            'quotes': 0,       # " '
            'numbers': 0       # 숫자 포함
        }
        
        for title in titles:
            # 한국어/영어 키워드 카운트
            title_lower = title.lower()
            
            for category, keywords in self.korean_patterns.items():
                for keyword in keywords:
                    if keyword in title:
                        all_keywords[category] += 1
            
            for category, keywords in self.english_patterns.items():
                for keyword in keywords:
                    if keyword in title_lower:
                        all_keywords[category] += 1
            
            # 특수 문자 분석
            if '!' in title:
                special_chars['exclamation'] += 1
            if '?' in title:
                special_chars['question'] += 1
            if any(char in title for char in '[]()'):
                special_chars['brackets'] += 1
            if any(char in title for char in '"\''):
                special_chars['quotes'] += 1
            if re.search(r'\d', title):
                special_chars['numbers'] += 1
        
        return {
            'avg_length': statistics.mean(title_lengths),
            'avg_word_count': statistics.mean(word_counts),
            'max_length': max(title_lengths),
            'min_length': min(title_lengths),
            'keyword_usage': all_keywords,
            'special_chars': special_chars,
            'total_titles': len(titles)
        }
    
    def _analyze_descriptions(self, descriptions: List[str]) -> Dict[str, Any]:
        """설명들을 분석하여 SEO 특성을 추출합니다."""
        
        if not descriptions:
            return {}
        
        # 기본 통계
        desc_lengths = [len(desc) for desc in descriptions]
        line_counts = [len(desc.split('\n')) for desc in descriptions]
        
        # 링크 및 해시태그 분석
        link_counts = []
        hashtag_counts = []
        
        for desc in descriptions:
            # URL 패턴 매칭
            urls = re.findall(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', desc)
            link_counts.append(len(urls))
            
            # 해시태그 패턴 매칭
            hashtags = re.findall(r'#\w+', desc)
            hashtag_counts.append(len(hashtags))
        
        return {
            'avg_length': statistics.mean(desc_lengths) if desc_lengths else 0,
            'avg_lines': statistics.mean(line_counts) if line_counts else 0,
            'avg_links': statistics.mean(link_counts) if link_counts else 0,
            'avg_hashtags': statistics.mean(hashtag_counts) if hashtag_counts else 0,
            'max_length': max(desc_lengths) if desc_lengths else 0,
            'has_description_ratio': len([d for d in descriptions if d.strip()]) / len(descriptions) if descriptions else 0
        }
    
    def _analyze_upload_times(self, upload_times: List[Dict[str, int]]) -> Dict[str, Any]:
        """업로드 시간 패턴을 분석합니다."""
        
        if not upload_times:
            return {}
        
        # 시간대별 분포
        hour_distribution = Counter(t['hour'] for t in upload_times)
        day_distribution = Counter(t['day_of_week'] for t in upload_times)
        month_distribution = Counter(t['month'] for t in upload_times)
        
        # 최빈값 찾기
        most_common_hour = hour_distribution.most_common(1)[0] if hour_distribution else (0, 0)
        most_common_day = day_distribution.most_common(1)[0] if day_distribution else (0, 0)
        
        # 요일 이름 매핑
        day_names = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일']
        
        return {
            'most_common_hour': {
                'hour': most_common_hour[0],
                'count': most_common_hour[1]
            },
            'most_common_day': {
                'day': most_common_day[0],
                'day_name': day_names[most_common_day[0]] if most_common_day[0] < 7 else '알 수 없음',
                'count': most_common_day[1]
            },
            'hour_distribution': dict(hour_distribution),
            'day_distribution': dict(day_distribution),
            'month_distribution': dict(month_distribution)
        }
    
    def _compare_groups(self, top_analysis: Dict[str, Any], bottom_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """상위 그룹과 하위 그룹을 비교 분석합니다."""
        
        comparison = {
            'view_performance': {
                'top_avg_views': top_analysis['statistics']['avg_views'],
                'bottom_avg_views': bottom_analysis['statistics']['avg_views'],
                'performance_gap': top_analysis['statistics']['avg_views'] / max(bottom_analysis['statistics']['avg_views'], 1)
            },
            'title_differences': {},
            'description_differences': {},
            'timing_differences': {}
        }
        
        # 제목 차이점
        top_title = top_analysis.get('title_analysis', {})
        bottom_title = bottom_analysis.get('title_analysis', {})
        
        if top_title and bottom_title:
            comparison['title_differences'] = {
                'length_diff': top_title.get('avg_length', 0) - bottom_title.get('avg_length', 0),
                'word_count_diff': top_title.get('avg_word_count', 0) - bottom_title.get('avg_word_count', 0),
                'keyword_usage_diff': {
                    category: top_title.get('keyword_usage', {}).get(category, 0) - 
                             bottom_title.get('keyword_usage', {}).get(category, 0)
                    for category in ['attention_grabbing', 'question_words', 'trending_words', 'emotional_words']
                }
            }
        
        # 설명 차이점
        top_desc = top_analysis.get('description_analysis', {})
        bottom_desc = bottom_analysis.get('description_analysis', {})
        
        if top_desc and bottom_desc:
            comparison['description_differences'] = {
                'length_diff': top_desc.get('avg_length', 0) - bottom_desc.get('avg_length', 0),
                'link_usage_diff': top_desc.get('avg_links', 0) - bottom_desc.get('avg_links', 0),
                'hashtag_usage_diff': top_desc.get('avg_hashtags', 0) - bottom_desc.get('avg_hashtags', 0)
            }
        
        return comparison
    
    def _generate_recommendations(self, comparison: Dict[str, Any], 
                                top_analysis: Dict[str, Any], 
                                bottom_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """비교 분석 결과를 바탕으로 개선 제안을 생성합니다."""
        
        recommendations = []
        
        # 제목 관련 제안
        title_diff = comparison.get('title_differences', {})
        if title_diff:
            length_diff = title_diff.get('length_diff', 0)
            if abs(length_diff) > 5:
                recommendations.append({
                    'category': '제목 최적화',
                    'type': 'length',
                    'priority': 'high',
                    'suggestion': f"제목 길이를 {'줄이는' if length_diff < 0 else '늘리는'} 것을 고려해보세요. "
                                f"상위 조회수 영상들의 평균 제목 길이는 {top_analysis['title_analysis']['avg_length']:.1f}자입니다.",
                    'impact': 'medium'
                })
            
            # 키워드 사용 제안
            keyword_diff = title_diff.get('keyword_usage_diff', {})
            for category, diff in keyword_diff.items():
                if diff > 0.5:  # 상위 그룹이 더 많이 사용
                    category_names = {
                        'attention_grabbing': '관심 유발 키워드',
                        'question_words': '질문형 키워드',
                        'trending_words': '트렌드 키워드',
                        'emotional_words': '감정 키워드'
                    }
                    recommendations.append({
                        'category': '키워드 사용',
                        'type': 'keyword',
                        'priority': 'medium',
                        'suggestion': f"{category_names.get(category, category)} 사용을 늘려보세요. "
                                    f"상위 조회수 영상들이 더 많이 활용하고 있습니다.",
                        'impact': 'high'
                    })
        
        # 설명 관련 제안
        desc_diff = comparison.get('description_differences', {})
        if desc_diff:
            length_diff = desc_diff.get('length_diff', 0)
            if abs(length_diff) > 100:
                recommendations.append({
                    'category': '설명 최적화',
                    'type': 'description_length',
                    'priority': 'medium',
                    'suggestion': f"영상 설명을 {'더 자세히' if length_diff > 0 else '더 간결하게'} 작성해보세요. "
                                f"상위 조회수 영상들의 평균 설명 길이는 {top_analysis['description_analysis']['avg_length']:.0f}자입니다.",
                    'impact': 'medium'
                })
        
        # 업로드 시간 제안
        top_timing = top_analysis.get('upload_time_analysis', {})
        if top_timing and top_timing.get('most_common_hour'):
            recommendations.append({
                'category': '업로드 타이밍',
                'type': 'timing',
                'priority': 'low',
                'suggestion': f"업로드 시간을 {top_timing['most_common_hour']['hour']}시경으로 고려해보세요. "
                            f"상위 조회수 영상들이 주로 이 시간대에 업로드됩니다.",
                'impact': 'low'
            })
        
        # 기본 제안이 없을 경우
        if not recommendations:
            recommendations.append({
                'category': '일반',
                'type': 'general',
                'priority': 'low',
                'suggestion': "현재 콘텐츠 전략이 일관성 있게 유지되고 있습니다. "
                            "꾸준한 업로드와 품질 관리에 집중하세요.",
                'impact': 'medium'
            })
        
        return recommendations