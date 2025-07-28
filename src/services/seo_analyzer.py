from typing import List, Dict, Any, Optional, Tuple
import re
import statistics
from collections import Counter
from datetime import datetime, timedelta
import logging
import math

from src.models.seo_config_models import (
    SEOAnalysisConfig, 
    ChannelType, 
    VideoType, 
    get_default_seo_config
)

logger = logging.getLogger(__name__)

class SEOAnalyzer:
    """Backlinko 가이드 기반 YouTube SEO 분석기"""
    
    def __init__(self, config: Optional[SEOAnalysisConfig] = None):
        self.config = config or get_default_seo_config()
        
        # Backlinko 기반 SEO 요소 가중치 (2024 업데이트)
        self.seo_factors = {
            'title_optimization': 0.30,      # 제목 최적화 (가장 중요)
            'engagement_signals': 0.35,      # 참여도 신호 (알고리즘 핵심)
            'description_quality': 0.15,     # 설명 품질
            'video_quality': 0.15,           # 영상 품질 (길이, 썸네일 등)
            'metadata_optimization': 0.05    # 메타데이터 최적화 (상대적으로 낮음)
        }
        
        # 제목 최적화 체크포인트 (Backlinko 기반)
        self.title_checkpoints = {
            'keyword_placement': 'front_loaded',    # 키워드를 앞쪽에 배치
            'emotional_triggers': True,             # 감정적 트리거 사용
            'curiosity_gap': True,                  # 호기심 갭 생성
            'specific_benefits': True,              # 구체적 혜택 제시
            'urgency_scarcity': False,              # 긴급성/희소성 (선택적)
            'power_words': True,                    # 파워 워드 사용
            'numbers_stats': True,                  # 숫자/통계 포함
            'question_format': False                # 질문 형태 (선택적)
        }
        
        # 설명 최적화 체크포인트
        self.description_checkpoints = {
            'keyword_density': (1.0, 3.0),         # 키워드 밀도 1-3%
            'first_line_hook': True,                # 첫 줄 훅
            'call_to_action': True,                 # 행동 유도
            'timestamp_chapters': False,            # 타임스탬프 챕터 (선택적)
            'external_links': False,                # 외부 링크 (선택적)
            'social_proof': False,                  # 사회적 증명 (선택적)
            'hashtags': (1, 3),                     # 해시태그 1-3개
            'video_summary': True                   # 영상 요약
        }
        
        # 참여도 신호 가중치 (Backlinko 기반)
        self.engagement_signals = {
            'like_ratio': 0.25,          # 좋아요 비율
            'comment_ratio': 0.20,       # 댓글 비율
            'share_ratio': 0.15,         # 공유 비율 (예상)
            'subscriber_conversion': 0.15, # 구독자 전환율 (예상)
            'click_through_rate': 0.25   # 클릭률 (썸네일 효과)
        }
        
        # 업계별 벤치마크 (2024 YouTube 트렌드 반영)
        self.industry_benchmarks = {
            'average_video_length': {
                'gaming': 720,      # 12분 (더 긴 컨텐츠 선호)
                'education': 1200,  # 20분 (깊이 있는 설명)
                'entertainment': 600, # 10분 (집중력 고려)
                'lifestyle': 900,   # 15분 (상세한 정보)
                'default': 800      # 13분 (전체 평균 상승)
            },
            'optimal_title_length': {
                'shorts': (20, 40),
                'regular': (40, 70),
                'live': (30, 60)
            },
            'description_length': {
                'minimum': 125,     # 최소 125자
                'optimal': (200, 500), # 최적 200-500자
                'maximum': 5000     # 최대 5000자
            }
        }
        
    def analyze_comprehensive_seo(self, videos: List[Dict[str, Any]], 
                                 force_channel_type: Optional[ChannelType] = None) -> Dict[str, Any]:
        """종합적인 SEO 분석 수행"""
        
        if not self.config.enabled:
            return {
                'success': False,
                'message': 'SEO 분석이 비활성화되어 있습니다.',
                'data': None
            }
        
        if not videos or len(videos) < self.config.thresholds.min_videos_required:
            return {
                'success': False,
                'message': f'SEO 분석을 위해서는 최소 {self.config.thresholds.min_videos_required}개 이상의 비디오가 필요합니다.',
                'data': None
            }
        
        try:
            # 채널 타입 감지
            channel_type = force_channel_type or self._detect_channel_type(videos)
            
            # 비디오별 SEO 점수 계산
            video_seo_scores = []
            for video in videos:
                seo_score = self._calculate_video_seo_score(video, channel_type)
                video_seo_scores.append({
                    'video_id': video.get('id', ''),
                    'title': video.get('title', ''),
                    'seo_score': seo_score,
                    'video_data': video
                })
            
            # 성과별 그룹 분리
            sorted_videos = sorted(video_seo_scores, key=lambda x: x['seo_score'], reverse=True)
            
            top_count = max(1, int(len(sorted_videos) * self.config.thresholds.percentile_threshold))
            bottom_count = max(1, int(len(sorted_videos) * self.config.thresholds.percentile_threshold))
            
            top_performers = sorted_videos[:top_count]
            bottom_performers = sorted_videos[-bottom_count:]
            
            # 세부 분석
            title_analysis = self._analyze_titles_advanced([v['video_data'] for v in sorted_videos], channel_type)
            description_analysis = self._analyze_descriptions_advanced([v['video_data'] for v in sorted_videos])
            engagement_analysis = self._analyze_engagement_advanced([v['video_data'] for v in sorted_videos])
            metadata_analysis = self._analyze_metadata([v['video_data'] for v in sorted_videos])
            
            # 개선 제안 생성
            recommendations = self._generate_backlinko_recommendations(
                top_performers, bottom_performers, title_analysis, 
                description_analysis, engagement_analysis, channel_type
            )
            
            # SEO 점수 분포 분석
            score_distribution = self._analyze_score_distribution(video_seo_scores)
            
            return {
                'success': True,
                'message': f'{len(videos)}개 비디오의 고급 SEO 분석이 완료되었습니다.',
                'data': {
                    'total_videos': len(videos),
                    'channel_type': channel_type.value if isinstance(channel_type, ChannelType) else channel_type,
                    'overall_seo_score': statistics.mean([v['seo_score'] for v in video_seo_scores]),
                    'top_performers': {
                        'count': len(top_performers),
                        'avg_score': statistics.mean([v['seo_score'] for v in top_performers]),
                        'videos': top_performers[:5]  # 상위 5개만 반환
                    },
                    'bottom_performers': {
                        'count': len(bottom_performers),
                        'avg_score': statistics.mean([v['seo_score'] for v in bottom_performers]),
                        'videos': bottom_performers[:5]  # 하위 5개만 반환
                    },
                    'analysis': {
                        'title_optimization': title_analysis,
                        'description_quality': description_analysis,
                        'engagement_signals': engagement_analysis,
                        'metadata_optimization': metadata_analysis
                    },
                    'score_distribution': score_distribution,
                    'recommendations': recommendations,
                    'benchmarks': self._get_channel_benchmarks(channel_type),
                    'analysis_method': 'backlinko_advanced',
                    'seo_factors_weights': self.seo_factors
                }
            }
            
        except Exception as e:
            logger.error(f"Advanced SEO analysis failed: {str(e)}")
            return {
                'success': False,
                'message': f'고급 SEO 분석 중 오류가 발생했습니다: {str(e)}',
                'data': None
            }
    
    def _calculate_video_seo_score(self, video: Dict[str, Any], channel_type: ChannelType) -> float:
        """Backlinko 기준 비디오 SEO 점수 계산"""
        
        scores = {}
        
        # 1. 제목 최적화 점수
        scores['title'] = self._score_title_optimization(video.get('title', ''), channel_type)
        
        # 2. 설명 품질 점수
        scores['description'] = self._score_description_quality(video.get('description', ''))
        
        # 3. 참여도 신호 점수
        scores['engagement'] = self._score_engagement_signals(video)
        
        # 4. 영상 품질 점수
        scores['video_quality'] = self._score_video_quality(video)
        
        # 5. 메타데이터 최적화 점수
        scores['metadata'] = self._score_metadata_optimization(video)
        
        # 가중평균으로 최종 점수 계산
        final_score = (
            scores['title'] * self.seo_factors['title_optimization'] +
            scores['description'] * self.seo_factors['description_quality'] +
            scores['engagement'] * self.seo_factors['engagement_signals'] +
            scores['video_quality'] * self.seo_factors['video_quality'] +
            scores['metadata'] * self.seo_factors['metadata_optimization']
        )
        
        return min(100, max(0, final_score))
    
    def _score_title_optimization(self, title: str, channel_type: ChannelType) -> float:
        """제목 최적화 점수 계산 (Backlinko 기준)"""
        if not title:
            return 0
        
        score = 0
        max_score = 100
        
        # 1. 길이 최적화 (20점)
        video_type = self._guess_video_type_from_title(title)
        optimal_range = self.industry_benchmarks['optimal_title_length'][video_type]
        title_length = len(title)
        
        if optimal_range[0] <= title_length <= optimal_range[1]:
            score += 20
        elif title_length < optimal_range[0]:
            score += 10  # 너무 짧음
        else:
            score += 5   # 너무 길음
        
        # 2. 키워드 앞쪽 배치 (15점)
        if self._has_front_loaded_keywords(title, channel_type):
            score += 15
        
        # 3. 감정적 트리거 사용 (15점)
        if self._has_emotional_triggers(title):
            score += 15
        
        # 4. 호기심 갭 생성 (15점)
        if self._creates_curiosity_gap(title):
            score += 15
        
        # 5. 구체적 혜택/결과 제시 (10점)
        if self._shows_specific_benefits(title):
            score += 10
        
        # 6. 파워 워드 사용 (10점)
        if self._contains_power_words(title):
            score += 10
        
        # 7. 숫자/통계 포함 (10점)
        if self._contains_numbers_or_stats(title):
            score += 10
        
        # 8. 클릭베이트 방지 (-5점, 과도한 경우)
        if self._is_excessive_clickbait(title):
            score -= 5
        
        # 9. 가독성 (5점)
        if self._is_readable_title(title):
            score += 5
        
        return min(max_score, score)
    
    def _score_description_quality(self, description: str) -> float:
        """설명 품질 점수 계산"""
        if not description:
            return 0
        
        score = 0
        max_score = 100
        
        # 1. 길이 최적화 (25점)
        desc_length = len(description)
        optimal_range = self.industry_benchmarks['description_length']['optimal']
        
        if optimal_range[0] <= desc_length <= optimal_range[1]:
            score += 25
        elif desc_length >= self.industry_benchmarks['description_length']['minimum']:
            score += 15
        else:
            score += 5
        
        # 2. 첫 줄 훅 (20점)
        if self._has_strong_opening_line(description):
            score += 20
        
        # 3. 키워드 밀도 (15점)
        keyword_density = self._calculate_keyword_density(description)
        if 1.0 <= keyword_density <= 3.0:
            score += 15
        elif keyword_density > 0:
            score += 8
        
        # 4. 행동 유도 문구 (15점)
        if self._has_call_to_action(description):
            score += 15
        
        # 5. 구조화된 내용 (10점)
        if self._is_well_structured(description):
            score += 10
        
        # 6. 해시태그 사용 (10점)
        hashtag_count = len(re.findall(r'#\w+', description))
        if 1 <= hashtag_count <= 3:
            score += 10
        elif hashtag_count > 0:
            score += 5
        
        # 7. 영상 요약 포함 (5점)
        if self._contains_video_summary(description):
            score += 5
        
        return min(max_score, score)
    
    def _score_engagement_signals(self, video: Dict[str, Any]) -> float:
        """참여도 신호 점수 계산"""
        stats = video.get('statistics', {})
        view_count = stats.get('view_count', 0)
        
        if view_count == 0:
            return 0
        
        score = 0
        max_score = 100
        
        # 1. 좋아요 비율 (30점)
        like_count = stats.get('like_count', 0)
        like_ratio = (like_count / view_count) * 100
        
        if like_ratio >= 2.0:      # 2% 이상 매우 좋음
            score += 30
        elif like_ratio >= 1.0:    # 1% 이상 좋음
            score += 25
        elif like_ratio >= 0.5:    # 0.5% 이상 보통
            score += 15
        else:
            score += 5
        
        # 2. 댓글 비율 (25점)
        comment_count = stats.get('comment_count', 0)
        comment_ratio = (comment_count / view_count) * 100
        
        if comment_ratio >= 0.5:   # 0.5% 이상 매우 좋음
            score += 25
        elif comment_ratio >= 0.2: # 0.2% 이상 좋음
            score += 20
        elif comment_ratio >= 0.1: # 0.1% 이상 보통
            score += 12
        else:
            score += 3
        
        # 3. 전체 참여율 (25점) - 좋아요 + 댓글
        total_engagement = (like_count + comment_count) / view_count * 100
        
        if total_engagement >= 3.0:
            score += 25
        elif total_engagement >= 2.0:
            score += 20
        elif total_engagement >= 1.0:
            score += 15
        else:
            score += 5
        
        # 4. 영상 길이 대비 참여도 (20점)
        duration = self._parse_duration(video.get('duration', ''))
        if duration > 0:
            engagement_per_minute = total_engagement / (duration / 60)
            if engagement_per_minute >= 1.0:
                score += 20
            elif engagement_per_minute >= 0.5:
                score += 15
            else:
                score += 8
        else:
            score += 10  # 기본 점수
        
        return min(max_score, score)
    
    def _score_video_quality(self, video: Dict[str, Any]) -> float:
        """영상 품질 점수 계산"""
        score = 0
        max_score = 100
        
        # 1. 영상 길이 최적화 (40점)
        duration = self._parse_duration(video.get('duration', ''))
        if duration > 0:
            # 채널 타입별 최적 길이와 비교
            optimal_length = self.industry_benchmarks['average_video_length'].get('default', 600)
            
            if 0.7 * optimal_length <= duration <= 1.5 * optimal_length:
                score += 40
            elif 0.5 * optimal_length <= duration <= 2.0 * optimal_length:
                score += 30
            else:
                score += 15
        else:
            score += 20  # 기본 점수
        
        # 2. 업로드 일관성 (30점)
        # 이는 개별 영상이 아닌 채널 전체 분석에서 계산되므로 기본 점수
        score += 20
        
        # 3. 썸네일 품질 추정 (30점)
        # 실제 썸네일 분석은 불가하므로 조회수와 참여도로 추정
        stats = video.get('statistics', {})
        view_count = stats.get('view_count', 0)
        like_count = stats.get('like_count', 0)
        
        if view_count > 0 and like_count > 0:
            estimated_ctr = min((like_count / view_count) * 50, 30)  # 추정 CTR
            score += estimated_ctr
        else:
            score += 15
        
        return min(max_score, score)
    
    def _score_metadata_optimization(self, video: Dict[str, Any]) -> float:
        """메타데이터 최적화 점수 계산"""
        score = 0
        max_score = 100
        
        # 1. 제목 존재 및 품질 (30점)
        title = video.get('title', '')
        if title:
            score += 20
            if len(title) >= 10:  # 최소 길이
                score += 10
        
        # 2. 설명 존재 및 품질 (40점)
        description = video.get('description', '')
        if description:
            score += 25
            if len(description) >= 125:  # Backlinko 권장 최소 길이
                score += 15
        
        # 3. 업로드 시간 최적화 (30점)
        # 업로드 시간 패턴 분석 (실제로는 전체 채널 분석 필요)
        score += 20  # 기본 점수
        
        return min(max_score, score)
    
    def _analyze_titles_advanced(self, videos: List[Dict[str, Any]], channel_type: ChannelType) -> Dict[str, Any]:
        """고급 제목 분석"""
        titles = [v.get('title', '') for v in videos]
        
        if not titles:
            return {}
        
        # 기본 통계
        title_lengths = [len(title) for title in titles]
        word_counts = [len(title.split()) for title in titles]
        
        # Backlinko 기준 분석
        analysis = {
            'basic_stats': {
                'avg_length': statistics.mean(title_lengths),
                'median_length': statistics.median(title_lengths),
                'avg_word_count': statistics.mean(word_counts),
                'total_titles': len(titles)
            },
            'optimization_scores': {
                'keyword_front_loading': sum(1 for t in titles if self._has_front_loaded_keywords(t, channel_type)) / len(titles) * 100,
                'emotional_triggers': sum(1 for t in titles if self._has_emotional_triggers(t)) / len(titles) * 100,
                'curiosity_gaps': sum(1 for t in titles if self._creates_curiosity_gap(t)) / len(titles) * 100,
                'specific_benefits': sum(1 for t in titles if self._shows_specific_benefits(t)) / len(titles) * 100,
                'power_words': sum(1 for t in titles if self._contains_power_words(t)) / len(titles) * 100,
                'numbers_stats': sum(1 for t in titles if self._contains_numbers_or_stats(t)) / len(titles) * 100
            },
            'common_patterns': self._identify_title_patterns(titles),
            'length_distribution': self._analyze_length_distribution(title_lengths),
            'readability_score': sum(1 for t in titles if self._is_readable_title(t)) / len(titles) * 100
        }
        
        return analysis
    
    def _analyze_descriptions_advanced(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """고급 설명 분석"""
        descriptions = [v.get('description', '') for v in videos if v.get('description')]
        
        if not descriptions:
            return {'no_descriptions': True}
        
        desc_lengths = [len(desc) for desc in descriptions]
        
        analysis = {
            'basic_stats': {
                'avg_length': statistics.mean(desc_lengths),
                'median_length': statistics.median(desc_lengths),
                'has_description_ratio': len(descriptions) / len(videos) * 100,
                'total_with_descriptions': len(descriptions)
            },
            'quality_scores': {
                'strong_openings': sum(1 for d in descriptions if self._has_strong_opening_line(d)) / len(descriptions) * 100,
                'call_to_actions': sum(1 for d in descriptions if self._has_call_to_action(d)) / len(descriptions) * 100,
                'well_structured': sum(1 for d in descriptions if self._is_well_structured(d)) / len(descriptions) * 100,
                'video_summaries': sum(1 for d in descriptions if self._contains_video_summary(d)) / len(descriptions) * 100
            },
            'content_analysis': {
                'avg_hashtags': statistics.mean([len(re.findall(r'#\w+', d)) for d in descriptions]),
                'avg_links': statistics.mean([len(re.findall(r'http[s]?://\S+', d)) for d in descriptions]),
                'avg_lines': statistics.mean([len(d.split('\n')) for d in descriptions])
            },
            'keyword_density_distribution': [self._calculate_keyword_density(d) for d in descriptions[:10]]  # 샘플만
        }
        
        return analysis
    
    def _analyze_engagement_advanced(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """고급 참여도 분석"""
        engagement_data = []
        
        for video in videos:
            stats = video.get('statistics', {})
            view_count = stats.get('view_count', 0)
            
            if view_count > 0:
                engagement_data.append({
                    'view_count': view_count,
                    'like_ratio': (stats.get('like_count', 0) / view_count) * 100,
                    'comment_ratio': (stats.get('comment_count', 0) / view_count) * 100,
                    'total_engagement': ((stats.get('like_count', 0) + stats.get('comment_count', 0)) / view_count) * 100
                })
        
        if not engagement_data:
            return {'no_engagement_data': True}
        
        analysis = {
            'average_metrics': {
                'avg_like_ratio': statistics.mean([e['like_ratio'] for e in engagement_data]),
                'avg_comment_ratio': statistics.mean([e['comment_ratio'] for e in engagement_data]),
                'avg_total_engagement': statistics.mean([e['total_engagement'] for e in engagement_data])
            },
            'benchmarks': {
                'excellent_like_ratio': 2.0,    # 2% 이상
                'good_like_ratio': 1.0,         # 1% 이상
                'excellent_comment_ratio': 0.5,  # 0.5% 이상
                'good_comment_ratio': 0.2       # 0.2% 이상
            },
            'distribution': {
                'high_engagement_videos': len([e for e in engagement_data if e['total_engagement'] >= 3.0]),
                'medium_engagement_videos': len([e for e in engagement_data if 1.0 <= e['total_engagement'] < 3.0]),
                'low_engagement_videos': len([e for e in engagement_data if e['total_engagement'] < 1.0])
            }
        }
        
        return analysis
    
    def _analyze_metadata(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """메타데이터 분석"""
        analysis = {
            'completeness': {
                'has_title': sum(1 for v in videos if v.get('title')) / len(videos) * 100,
                'has_description': sum(1 for v in videos if v.get('description')) / len(videos) * 100,
                'has_duration': sum(1 for v in videos if v.get('duration')) / len(videos) * 100
            },
            'upload_patterns': self._analyze_upload_patterns(videos),
            'video_types': self._analyze_video_type_distribution(videos)
        }
        
        return analysis
    
    # 헬퍼 메서드들
    def _has_front_loaded_keywords(self, title: str, channel_type: ChannelType) -> bool:
        """키워드가 제목 앞쪽에 배치되었는지 확인"""
        words = title.split()
        if len(words) < 3:
            return False
        
        # 첫 3단어 중에 채널 타입 관련 키워드가 있는지 확인
        first_three = ' '.join(words[:3]).lower()
        
        # 설정된 키워드 패턴에서 확인
        for category in ['attention_grabbing', 'question_words', 'trending_words']:
            korean_keywords = getattr(self.config.keyword_patterns.korean, category, [])
            english_keywords = getattr(self.config.keyword_patterns.english, category, [])
            
            for keyword in korean_keywords + english_keywords:
                if keyword.lower() in first_three:
                    return True
        
        return False
    
    def _has_emotional_triggers(self, title: str) -> bool:
        """감정적 트리거가 있는지 확인"""
        emotional_words = (
            self.config.keyword_patterns.korean.emotional_words +
            self.config.keyword_patterns.english.emotional_words +
            self.config.keyword_patterns.korean.attention_grabbing +
            self.config.keyword_patterns.english.attention_grabbing
        )
        
        title_lower = title.lower()
        return any(word in title_lower for word in emotional_words)
    
    def _creates_curiosity_gap(self, title: str) -> bool:
        """호기심 갭을 생성하는지 확인"""
        curiosity_indicators = [
            # 한국어
            '비밀', '진실', '이유', '방법', '놀라운', '충격', '실제로', '정말', '사실',
            '몰랐던', '숨겨진', '미공개', '최초', '독점', '내부', '뒤에서',
            # 영어  
            'secret', 'truth', 'reason', 'hidden', 'revealed', 'shocking', 
            'surprising', 'unknown', 'behind', 'real', 'actual'
        ]
        
        title_lower = title.lower()
        return any(indicator in title_lower for indicator in curiosity_indicators)
    
    def _shows_specific_benefits(self, title: str) -> bool:
        """구체적인 혜택이나 결과를 제시하는지 확인"""
        benefit_patterns = [
            r'\d+분', r'\d+시간', r'\d+일', r'\d+주', r'\d+개월',  # 시간 관련
            r'\d+%', r'\d+배', r'\d+원', r'\d+만원',              # 수치 관련
            r'\d+가지', r'\d+개', r'\d+번',                      # 개수 관련
        ]
        
        for pattern in benefit_patterns:
            if re.search(pattern, title):
                return True
                
        return False
    
    def _contains_power_words(self, title: str) -> bool:
        """파워 워드가 포함되어 있는지 확인"""
        power_words = [
            # 한국어 (2024 트렌드 반영)
            '완벽', '최고', '최상', '프리미엄', '고급', '전문', '마스터', '프로',
            '보장', '확실', '검증', '인증', '공식', '정식', '정품', '신뢰',
            '혁신', '혁명', '획기적', '새로운', '최신', '업데이트', '개선',
            '꿀템', '신박', '갓생', '핫플', '존맛', '킹받', '띵작', '실화',
            # 영어 (2024 트렌드 반영)
            'ultimate', 'best', 'premium', 'professional', 'master', 'expert',
            'guaranteed', 'proven', 'certified', 'official', 'authentic',
            'revolutionary', 'innovative', 'breakthrough', 'advanced',
            'viral', 'trending', 'game-changer', 'mind-blowing', 'epic'
        ]
        
        title_lower = title.lower()
        return any(word in title_lower for word in power_words)
    
    def _contains_numbers_or_stats(self, title: str) -> bool:
        """숫자나 통계가 포함되어 있는지 확인"""
        return bool(re.search(r'\d+', title))
    
    def _is_excessive_clickbait(self, title: str) -> bool:
        """과도한 클릭베이트인지 확인"""
        clickbait_indicators = [
            '!!!', '???', '대박!!!', '충격!!!', '실화???',
            '클릭', '누르면', '보면', '절대', '무조건'
        ]
        
        excessive_count = sum(1 for indicator in clickbait_indicators if indicator in title)
        return excessive_count >= 2
    
    def _is_readable_title(self, title: str) -> bool:
        """제목의 가독성 확인"""
        # 너무 길거나 짧지 않고, 적절한 구두점 사용
        if len(title) < 10 or len(title) > 100:
            return False
        
        # 과도한 특수문자 사용 확인
        special_char_ratio = len(re.findall(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\?]', title)) / len(title)
        if special_char_ratio > 0.3:
            return False
        
        return True
    
    def _guess_video_type_from_title(self, title: str) -> str:
        """제목으로부터 비디오 타입 추정"""
        title_lower = title.lower()
        
        shorts_indicators = ['shorts', 'short', '짧은', '1분', '30초', '#shorts']
        live_indicators = ['live', '라이브', '생방송', 'stream']
        
        if any(indicator in title_lower for indicator in shorts_indicators):
            return 'shorts'
        elif any(indicator in title_lower for indicator in live_indicators):
            return 'live'
        else:
            return 'regular'
    
    def _has_strong_opening_line(self, description: str) -> bool:
        """강력한 오프닝 라인이 있는지 확인"""
        if not description:
            return False
        
        first_line = description.split('\n')[0]
        
        # 첫 줄이 너무 짧거나 길면 안됨
        if len(first_line) < 20 or len(first_line) > 150:
            return False
        
        # 훅 요소들 확인
        hook_elements = [
            '궁금', '놀라운', '충격', '비밀', '진실', '실제', '정말',
            'amazing', 'shocking', 'incredible', 'secret', 'truth'
        ]
        
        return any(element in first_line.lower() for element in hook_elements)
    
    def _calculate_keyword_density(self, text: str) -> float:
        """키워드 밀도 계산 (단순화된 버전)"""
        if not text:
            return 0
        
        words = text.split()
        if len(words) < 10:
            return 0
        
        # 주요 키워드들의 출현 빈도 계산 (실제로는 더 정교한 키워드 분석 필요)
        common_keywords = ['유튜브', 'youtube', '영상', 'video', '채널', 'channel']
        keyword_count = sum(1 for word in words if word.lower() in common_keywords)
        
        return (keyword_count / len(words)) * 100
    
    def _has_call_to_action(self, description: str) -> bool:
        """행동 유도 문구가 있는지 확인"""
        cta_phrases = [
            '구독', '좋아요', '댓글', '공유', '알림', '클릭', '시청',
            'subscribe', 'like', 'comment', 'share', 'bell', 'click', 'watch'
        ]
        
        description_lower = description.lower()
        return any(phrase in description_lower for phrase in cta_phrases)
    
    def _is_well_structured(self, description: str) -> bool:
        """잘 구조화된 설명인지 확인"""
        lines = description.split('\n')
        
        # 최소 3줄 이상
        if len(lines) < 3:
            return False
        
        # 빈 줄이 적절히 있는지 (구조화의 지표)
        empty_lines = sum(1 for line in lines if not line.strip())
        
        return empty_lines >= 1 and len(lines) >= 5
    
    def _contains_video_summary(self, description: str) -> bool:
        """영상 요약이 포함되어 있는지 확인"""
        summary_indicators = [
            '요약', '정리', '핵심', '포인트', '내용', '개요',
            'summary', 'overview', 'key points', 'highlights'
        ]
        
        description_lower = description.lower()
        return any(indicator in description_lower for indicator in summary_indicators)
    
    def _parse_duration(self, duration_str: str) -> int:
        """ISO 8601 duration을 초로 변환"""
        if not duration_str:
            return 0
        
        try:
            # PT1H2M30S 형태 파싱
            match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration_str)
            if match:
                hours = int(match.group(1) or 0)
                minutes = int(match.group(2) or 0)
                seconds = int(match.group(3) or 0)
                return hours * 3600 + minutes * 60 + seconds
        except:
            pass
        
        return 0
    
    def _detect_channel_type(self, videos: List[Dict[str, Any]]) -> ChannelType:
        """채널 타입 감지"""
        all_titles = ' '.join([video.get('title', '') for video in videos]).lower()
        
        scores = {}
        for channel_type, keywords in self.config.channel_detection_keywords.items():
            scores[channel_type] = sum(1 for keyword in keywords if keyword in all_titles)
        
        if scores and max(scores.values()) > 0:
            return max(scores, key=scores.get)
        else:
            return ChannelType.DEFAULT
    
    def _get_channel_benchmarks(self, channel_type: ChannelType) -> Dict[str, Any]:
        """채널 타입별 벤치마크 반환"""
        return {
            'optimal_video_length': self.industry_benchmarks['average_video_length'].get(
                channel_type.value if isinstance(channel_type, ChannelType) else channel_type, 
                600
            ),
            'title_length_range': self.industry_benchmarks['optimal_title_length']['regular'],
            'description_length_range': self.industry_benchmarks['description_length']['optimal'],
            'engagement_benchmarks': {
                'excellent_like_ratio': 2.0,
                'good_like_ratio': 1.0,
                'excellent_comment_ratio': 0.5,
                'good_comment_ratio': 0.2
            }
        }
    
    def _analyze_score_distribution(self, video_scores: List[Dict[str, Any]]) -> Dict[str, Any]:
        """SEO 점수 분포 분석"""
        scores = [v['seo_score'] for v in video_scores]
        
        return {
            'avg_score': statistics.mean(scores),
            'median_score': statistics.median(scores),
            'min_score': min(scores),
            'max_score': max(scores),
            'score_ranges': {
                'excellent': len([s for s in scores if s >= 80]),
                'good': len([s for s in scores if 60 <= s < 80]),
                'average': len([s for s in scores if 40 <= s < 60]),
                'poor': len([s for s in scores if s < 40])
            }
        }
    
    def _generate_backlinko_recommendations(self, top_performers: List[Dict], 
                                          bottom_performers: List[Dict],
                                          title_analysis: Dict, description_analysis: Dict,
                                          engagement_analysis: Dict, channel_type: ChannelType) -> List[Dict[str, Any]]:
        """Backlinko 기준 개선 제안 생성"""
        recommendations = []
        
        # 1. 제목 최적화 제안
        if title_analysis.get('optimization_scores', {}).get('keyword_front_loading', 0) < 50:
            recommendations.append({
                'category': '제목 최적화 - 키워드 배치',
                'type': 'title_keywords',
                'priority': 'high',
                'suggestion': '제목 앞쪽에 주요 키워드를 배치하세요. 첫 3단어 안에 핵심 키워드가 들어가야 합니다.',
                'impact': 'high',
                'backlinko_principle': 'Front-load keywords for better search visibility',
                'actionable_steps': [
                    '제목의 첫 3단어에 주요 키워드 포함',
                    '브랜드명보다 키워드를 앞에 배치',
                    'SEO 도구로 키워드 순위 확인'
                ]
            })
        
        # 2. 감정적 트리거 제안
        if title_analysis.get('optimization_scores', {}).get('emotional_triggers', 0) < 40:
            recommendations.append({
                'category': '제목 최적화 - 감정적 트리거',
                'type': 'emotional_engagement',
                'priority': 'high',
                'suggestion': '감정적 트리거를 사용하여 클릭률을 높이세요. "놀라운", "충격적인", "비밀" 등의 단어를 활용하세요.',
                'impact': 'high',
                'backlinko_principle': 'Emotional triggers increase click-through rates',
                'actionable_steps': [
                    '파워 워드 리스트 작성 및 활용',
                    '타겟 감정 (호기심, 놀라움, 긴급성) 선택',
                    'A/B 테스트로 효과적인 트리거 찾기'
                ]
            })
        
        # 3. 설명 최적화 제안
        if description_analysis.get('quality_scores', {}).get('call_to_actions', 0) < 60:
            recommendations.append({
                'category': '설명 최적화 - 행동 유도',
                'type': 'description_cta',
                'priority': 'medium',
                'suggestion': '설명에 명확한 행동 유도 문구를 추가하세요. 구독, 좋아요, 댓글을 요청하는 문구가 필요합니다.',
                'impact': 'medium',
                'backlinko_principle': 'Clear CTAs improve engagement signals',
                'actionable_steps': [
                    '설명 첫 줄에 핵심 CTA 배치',
                    '구체적인 행동 요청 (예: "댓글로 의견 남겨주세요")',
                    '감사 인사와 함께 CTA 포함'
                ]
            })
        
        # 4. 참여도 개선 제안
        if engagement_analysis.get('average_metrics', {}).get('avg_like_ratio', 0) < 1.0:
            recommendations.append({
                'category': '참여도 향상',
                'type': 'engagement_optimization',
                'priority': 'high',
                'suggestion': f'좋아요 비율이 {engagement_analysis.get("average_metrics", {}).get("avg_like_ratio", 0):.2f}%로 낮습니다. 1% 이상을 목표로 하세요.',
                'impact': 'high',
                'backlinko_principle': 'Higher engagement signals boost rankings',
                'actionable_steps': [
                    '영상 중간과 끝에 좋아요 요청',
                    '논란의 여지가 있는 주제로 토론 유도',
                    '시청자 질문에 적극적으로 답변'
                ]
            })
        
        # 5. 호기심 갭 생성 제안
        if title_analysis.get('optimization_scores', {}).get('curiosity_gaps', 0) < 30:
            recommendations.append({
                'category': '제목 최적화 - 호기심 갭',
                'type': 'curiosity_gap',
                'priority': 'medium',
                'suggestion': '호기심 갭을 생성하여 클릭률을 높이세요. "이 방법을 알면...", "대부분이 모르는..." 같은 표현을 사용하세요.',
                'impact': 'medium',
                'backlinko_principle': 'Curiosity gaps drive higher click-through rates',
                'actionable_steps': [
                    '미완성 문장으로 궁금증 유발',
                    '결과는 영상에서만 공개하는 방식',
                    '반전이나 놀라운 사실 암시'
                ]
            })
        
        # 6. 영상 길이 최적화 제안
        optimal_length = self.industry_benchmarks['average_video_length'].get(
            channel_type.value if isinstance(channel_type, ChannelType) else 'default', 600
        )
        
        recommendations.append({
            'category': '영상 길이 최적화',
            'type': 'video_length',
            'priority': 'medium',
            'suggestion': f'{channel_type.value if isinstance(channel_type, ChannelType) else "일반"} 채널의 최적 길이는 {optimal_length//60}분입니다. 시청 유지율을 고려하여 길이를 조정하세요.',
            'impact': 'medium',
            'backlinko_principle': 'Optimal video length varies by content type',
            'actionable_steps': [
                f'목표 길이: {optimal_length//60}분 ± 2분',
                '도입부 30초 내에 핵심 내용 예고',
                '시청 유지율 분석하여 최적 길이 찾기'
            ]
        })
        
        return recommendations
    
    def _identify_title_patterns(self, titles: List[str]) -> Dict[str, Any]:
        """제목 패턴 식별"""
        patterns = {
            'how_to_format': len([t for t in titles if any(word in t.lower() for word in ['how to', '어떻게', '방법'])]),
            'list_format': len([t for t in titles if re.search(r'\d+.*가지|\d+.*things|\d+.*ways', t.lower())]),
            'question_format': len([t for t in titles if t.endswith('?') or any(word in t for word in ['왜', '무엇', '언제'])]),
            'vs_comparison': len([t for t in titles if ' vs ' in t.lower() or ' 대 ' in t or '비교' in t]),
            'year_specific': len([t for t in titles if re.search(r'20\d{2}', t)])
        }
        
        return patterns
    
    def _analyze_length_distribution(self, lengths: List[int]) -> Dict[str, int]:
        """길이 분포 분석"""
        return {
            'very_short': len([l for l in lengths if l < 30]),    # 매우 짧음
            'short': len([l for l in lengths if 30 <= l < 50]),   # 짧음
            'optimal': len([l for l in lengths if 50 <= l < 70]), # 최적
            'long': len([l for l in lengths if 70 <= l < 100]),   # 김
            'very_long': len([l for l in lengths if l >= 100])    # 매우 김
        }
    
    def _analyze_upload_patterns(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """업로드 패턴 분석"""
        upload_dates = []
        
        for video in videos:
            try:
                published_at = video.get('published_at', '')
                if published_at:
                    dt = datetime.fromisoformat(published_at.replace('Z', '+00:00'))
                    upload_dates.append(dt)
            except:
                continue
        
        if not upload_dates:
            return {'no_data': True}
        
        # 업로드 간격 분석
        upload_dates.sort()
        intervals = []
        for i in range(1, len(upload_dates)):
            interval = (upload_dates[i] - upload_dates[i-1]).days
            intervals.append(interval)
        
        return {
            'avg_interval_days': statistics.mean(intervals) if intervals else 0,
            'most_active_hour': Counter([dt.hour for dt in upload_dates]).most_common(1)[0] if upload_dates else (0, 0),
            'most_active_day': Counter([dt.weekday() for dt in upload_dates]).most_common(1)[0] if upload_dates else (0, 0),
            'consistency_score': self._calculate_consistency_score(intervals)
        }
    
    def _calculate_consistency_score(self, intervals: List[int]) -> float:
        """업로드 일관성 점수 계산"""
        if not intervals:
            return 0
        
        # 표준편차가 낮을수록 일관성이 높음
        if len(intervals) < 2:
            return 50
        
        std_dev = statistics.stdev(intervals)
        avg_interval = statistics.mean(intervals)
        
        # 변동계수 계산 (표준편차/평균)
        cv = std_dev / avg_interval if avg_interval > 0 else 1
        
        # 0-100 점수로 변환 (변동계수가 낮을수록 높은 점수)
        consistency_score = max(0, 100 - (cv * 50))
        
        return min(100, consistency_score)
    
    def _analyze_video_type_distribution(self, videos: List[Dict[str, Any]]) -> Dict[str, int]:
        """비디오 타입 분포 분석"""
        distribution = {'shorts': 0, 'regular': 0, 'live': 0}
        
        for video in videos:
            video_type = self._guess_video_type_from_title(video.get('title', ''))
            distribution[video_type] += 1
        
        return distribution