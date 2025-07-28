"""URL 스팸 탐지 서비스"""

import re
from typing import Dict, List, Any, Optional, Set
from urllib.parse import urlparse, parse_qs
import logging

logger = logging.getLogger(__name__)


class URLSpamDetector:
    """댓글 내 URL 및 스팸 패턴 탐지"""
    
    def __init__(self):
        # 카테고리별 의심 패턴 정의
        self.suspicious_patterns = {
            'adult_content': {
                'keywords': ['성인', '19금', 'l9금', 'adult', 'xxx', 'porn', '야동', '성인방송', '19방', '성인사이트'],
                'domains': ['xvideos.com', 'pornhub.com', 'xnxx.com'],
                'risk_score': 10
            },
            'promotion': {
                'keywords': ['내 채널', '구독', '좋아요', '팔로우', '구독하고', '좋아요하고', '내채널', '제채널', '체널', '기억해주세요', '꼭 기억', '잊지 말아'],
                'domains': ['youtube.com', 'youtu.be'],
                'risk_score': 5
            },
            'malicious': {
                'keywords': ['클릭', '링크', '바로가기', '접속', '방문'],
                'domains': ['bit.ly', 'tinyurl.com', 'short.link', 'ow.ly', 'tiny.cc'],
                'risk_score': 8
            },
            'gambling': {
                'keywords': ['카지노', '도박', 'casino', 'bet', '배팅', '토토', '슬롯'],
                'domains': ['casino.com', 'bet365.com'],
                'risk_score': 9
            },
            'scam': {
                'keywords': ['무료', '이벤트', '당첨', '공짜', '돈벌기', '수익', '재택', '부업'],
                'domains': [],
                'risk_score': 7
            },
            'commercial': {
                'keywords': ['판매', '구매', '할인', '특가', '쇼핑', '상품', '주문'],
                'domains': ['shopping.naver.com', 'coupang.com', 'gmarket.co.kr'],
                'risk_score': 4
            },
            'suspicious_content': {
                'keywords': ['분노', '평화', '마음속', '진정한', '부드럽게', '다스리', '평화로운', '삶'],
                'domains': [],
                'risk_score': 3
            },
            'adult_slang': {
                'keywords': ['상남자', '선물ㄱㄱ', '핵불닭맛', '걸..ㄹ', '난리났던', '진심', 'ㄹㅇ', '갤에서'],
                'domains': [],
                'risk_score': 8
            }
        }
        
        # URL 추출 정규식 패턴
        self.url_patterns = [
            # HTTP/HTTPS URL
            r'https?://(?:[-\w.])+(?:[:\d]+)?(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?',
            # www.도메인.com 형태
            r'www\.(?:[-\w.])+\.(?:com|kr|net|org|edu|gov|co\.kr|ne\.kr)(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?',
            # 도메인.com 형태 (단, 한국어와 혼재 시)
            r'(?:^|\s)(?:[-\w.]+\.(?:com|kr|net|org|edu|gov|co\.kr|ne\.kr))(?:/(?:[\w/_.])*(?:\?(?:[\w&=%.])*)?(?:#(?:[\w.])*)?)?',
            # 유튜브 채널 ID 형태
            r'(?:youtube\.com/channel/|youtube\.com/@|youtu\.be/)[\w-]+',
            # 단축 URL 패턴
            r'(?:bit\.ly|tinyurl\.com|ow\.ly|tiny\.cc)/[\w-]+',
        ]
        
        # 유튜브 채널 패턴 (더 정교한 탐지)
        self.youtube_patterns = [
            r'youtube\.com/channel/([A-Za-z0-9_-]+)',
            r'youtube\.com/@([A-Za-z0-9_가-힣-]+)',
            r'youtube\.com/c/([A-Za-z0-9_가-힣-]+)',
            r'youtube\.com/user/([A-Za-z0-9_-]+)',
            r'youtu\.be/([A-Za-z0-9_-]+)',
        ]
        
        # 닉네임 의심 패턴
        self.suspicious_nickname_patterns = [
            r'.*채널.*',
            r'.*체널.*',  # 오타 포함
            r'.*구독.*',
            r'.*tv.*',
            r'.*TV.*',
            r'.*방송.*',
            r'.*유튜브.*',
            r'.*youtube.*',
            r'.*\.com.*',
            r'.*\.kr.*',
            r'.*www\..*',
            r'.*http.*',
            r'.*19금.*',
            r'.*l9금.*',  # 숫자를 l로 대체한 경우
            r'.*성인.*',
            r'.*adult.*',
            r'.*DOPAMIN.*',
            r'.*HIGH.*',
            r'.*PAIMIUM.*',
            r'.*NEW.*',
            r'.*레드.*',
            r'.*다크.*',
            r'.*_.*_.*',  # 언더스코어가 2개 이상인 경우
            r'.*-.*-.*-.*',  # 하이픈이 3개 이상인 경우
            r'.*클릭.*',
            r'.*ON팬.*',
            r'.*사건.*',
            r'.*l9.*ON.*',  # l9와 ON이 함께 있는 경우
        ]
    
    def extract_urls(self, text: str) -> List[Dict[str, Any]]:
        """텍스트에서 URL 추출"""
        urls = []
        
        for pattern in self.url_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                url = match.group(0).strip()
                if url:
                    urls.append({
                        'url': url,
                        'start': match.start(),
                        'end': match.end(),
                        'pattern_type': 'url'
                    })
        
        return urls
    
    def extract_youtube_info(self, text: str) -> List[Dict[str, Any]]:
        """유튜브 채널/비디오 정보 추출"""
        youtube_info = []
        
        for pattern in self.youtube_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                youtube_info.append({
                    'full_match': match.group(0),
                    'identifier': match.group(1) if match.groups() else None,
                    'type': self._get_youtube_type(pattern),
                    'start': match.start(),
                    'end': match.end()
                })
        
        return youtube_info
    
    def _get_youtube_type(self, pattern: str) -> str:
        """유튜브 패턴 타입 결정"""
        if 'channel/' in pattern:
            return 'channel_id'
        elif '/@' in pattern:
            return 'handle'
        elif '/c/' in pattern:
            return 'custom_url'
        elif '/user/' in pattern:
            return 'username'
        elif 'youtu.be' in pattern:
            return 'video_id'
        return 'unknown'
    
    def analyze_nickname(self, nickname: str) -> Dict[str, Any]:
        """닉네임 분석"""
        suspicion_score = 0
        detected_patterns = []
        
        # 의심스러운 닉네임 패턴 체크
        for pattern in self.suspicious_nickname_patterns:
            if re.search(pattern, nickname, re.IGNORECASE):
                suspicion_score += 2
                detected_patterns.append(pattern)
        
        # URL이 포함된 닉네임 체크
        nickname_urls = self.extract_urls(nickname)
        if nickname_urls:
            suspicion_score += 5
            detected_patterns.append('contains_url')
        
        return {
            'suspicion_score': suspicion_score,
            'detected_patterns': detected_patterns,
            'contains_url': len(nickname_urls) > 0,
            'urls': nickname_urls
        }
    
    def categorize_risks(self, urls: List[Dict[str, Any]], comment_text: str, author_name: str) -> Dict[str, Any]:
        """URL 및 텍스트 위험도 분류"""
        total_risk_score = 0
        detected_categories = []
        url_analysis = []
        
        # URL 분석
        for url_info in urls:
            url = url_info['url']
            parsed_url = urlparse(url) if url.startswith(('http://', 'https://')) else None
            domain = parsed_url.netloc.lower() if parsed_url else url.lower()
            
            url_risk = {
                'url': url,
                'domain': domain,
                'categories': [],
                'risk_score': 0
            }
            
            # 카테고리별 위험도 체크
            for category, config in self.suspicious_patterns.items():
                category_risk = 0
                
                # 도메인 체크
                if any(d in domain for d in config['domains']):
                    category_risk += config['risk_score']
                    url_risk['categories'].append(category)
                
                # 키워드 체크 (URL 주변 텍스트)
                text_around_url = comment_text[max(0, url_info['start']-50):url_info['end']+50]
                for keyword in config['keywords']:
                    if keyword in text_around_url.lower():
                        category_risk += config['risk_score'] * 0.5
                        if category not in url_risk['categories']:
                            url_risk['categories'].append(category)
                
                url_risk['risk_score'] += category_risk
            
            url_analysis.append(url_risk)
            total_risk_score += url_risk['risk_score']
            detected_categories.extend(url_risk['categories'])
        
        # 텍스트 전체 키워드 분석
        text_risk = self._analyze_text_keywords(comment_text)
        total_risk_score += text_risk['risk_score']
        detected_categories.extend(text_risk['categories'])
        
        # 닉네임 분석
        nickname_analysis = self.analyze_nickname(author_name)
        total_risk_score += nickname_analysis['suspicion_score']
        
        return {
            'total_risk_score': total_risk_score,
            'detected_categories': list(set(detected_categories)),
            'url_analysis': url_analysis,
            'text_analysis': text_risk,
            'nickname_analysis': nickname_analysis,
            'is_suspicious': total_risk_score >= 6,  # 임계값 설정
            'suspicion_level': self._get_suspicion_level(total_risk_score)
        }
    
    def _analyze_text_keywords(self, text: str) -> Dict[str, Any]:
        """텍스트 키워드 분석"""
        text_lower = text.lower()
        total_risk = 0
        detected_categories = []
        
        for category, config in self.suspicious_patterns.items():
            category_score = 0
            detected_keywords = []
            
            for keyword in config['keywords']:
                if keyword in text_lower:
                    category_score += 1
                    detected_keywords.append(keyword)
            
            if category_score > 0:
                total_risk += category_score * (config['risk_score'] * 0.3)
                detected_categories.append(category)
        
        return {
            'risk_score': total_risk,
            'categories': detected_categories
        }
    
    def _get_suspicion_level(self, risk_score: float) -> str:
        """위험도 레벨 결정"""
        if risk_score >= 15:
            return 'high'
        elif risk_score >= 8:
            return 'medium'
        elif risk_score >= 3:
            return 'low'
        else:
            return 'safe'
    
    def _analyze_nickname_content_combination(self, nickname: str, comment_text: str) -> Dict[str, Any]:
        """닉네임과 댓글 내용의 조합 분석"""
        combination_score = 0
        detected_patterns = []
        
        # 닉네임에 채널/체널이 있고 댓글에 프로모션 키워드가 있는 경우
        if re.search(r'.*체?널.*', nickname, re.IGNORECASE):
            promotion_keywords = ['기억해주세요', '꼭 기억', '잊지 말아', '기억하고', '꼭 잊지']
            for keyword in promotion_keywords:
                if keyword in comment_text:
                    combination_score += 8
                    detected_patterns.append(f'channel_name_with_promotion: {keyword}')
        
        # 닉네임에 19금/l9금이 있는 경우
        if re.search(r'.*(19금|l9금).*', nickname, re.IGNORECASE):
            combination_score += 10
            detected_patterns.append('adult_content_in_nickname')
        
        # 닉네임에 특정 키워드 조합이 있는 경우 (DOPAMIN, HIGH, NEW 등)
        suspicious_keywords = ['DOPAMIN', 'HIGH', 'NEW', 'PAIMIUM', '레드', '다크', '클릭', 'ON팬', '사건']
        nickname_upper = nickname.upper()
        keyword_count = sum(1 for keyword in suspicious_keywords if keyword in nickname_upper)
        if keyword_count >= 2:
            combination_score += 6
            detected_patterns.append(f'multiple_suspicious_keywords: {keyword_count}')
        
        # 닉네임에 하이픈이 3개 이상 있는 경우 (클릭-l9-ON팬NEW사건-t 패턴)
        if len(re.findall(r'-', nickname)) >= 3:
            combination_score += 5
            detected_patterns.append('multiple_hyphens_in_nickname')
        
        # 닉네임 끝에 단일 문자가 있는 경우 (봇 패턴)
        if re.search(r'.*-[a-zA-Z]$', nickname):
            combination_score += 4
            detected_patterns.append('single_char_suffix')
        
        # 댓글에 성인 슬랭이 있는 경우
        adult_slang_keywords = ['상남자', '선물ㄱㄱ', '핵불닭맛', '걸..ㄹ', '난리났던']
        for slang in adult_slang_keywords:
            if slang in comment_text:
                combination_score += 6
                detected_patterns.append(f'adult_slang_detected: {slang}')
        
        # 자음만 있는 텍스트 패턴 (ㄱㄱ, ㄹㅇ 등)
        consonant_pattern = re.findall(r'[ㄱ-ㅎ]{2,}', comment_text)
        if consonant_pattern:
            combination_score += 3
            detected_patterns.append(f'consonant_pattern: {consonant_pattern}')
        
        # 이모지로 시작하는 스팸 패턴
        if comment_text.strip().startswith('👈'):
            combination_score += 5
            detected_patterns.append('emoji_spam_start')
        
        # 닉네임과 댓글 내용이 너무 유사한 경우
        nickname_words = set(re.findall(r'\w+', nickname.lower()))
        comment_words = set(re.findall(r'\w+', comment_text.lower()))
        if len(nickname_words) > 0:
            overlap_ratio = len(nickname_words & comment_words) / len(nickname_words)
            if overlap_ratio > 0.5:
                combination_score += 4
                detected_patterns.append(f'high_nickname_comment_overlap: {overlap_ratio:.2f}')
        
        return {
            'combination_score': combination_score,
            'detected_patterns': detected_patterns
        }
    
    def analyze_comment(self, comment_text: str, author_name: str) -> Dict[str, Any]:
        """댓글 종합 분석"""
        try:
            # URL 추출
            urls = self.extract_urls(comment_text)
            
            # 유튜브 정보 추출
            youtube_info = self.extract_youtube_info(comment_text)
            
            # 위험도 분석
            risk_analysis = self.categorize_risks(urls, comment_text, author_name)
            
            # 추가 패턴 분석
            additional_patterns = self._analyze_additional_patterns(comment_text, author_name)
            
            # 닉네임과 댓글 내용 조합 분석
            combination_analysis = self._analyze_nickname_content_combination(author_name, comment_text)
            
            # 최종 스팸 점수 계산
            total_spam_score = (
                risk_analysis['total_risk_score'] + 
                additional_patterns['promotional_score'] * 2 + 
                combination_analysis['combination_score']
            )
            
            return {
                'urls': urls,
                'youtube_info': youtube_info,
                'risk_analysis': risk_analysis,
                'additional_patterns': additional_patterns,
                'combination_analysis': combination_analysis,
                'is_spam': total_spam_score >= 6 or risk_analysis['is_suspicious'] or additional_patterns['is_promotional'],
                'spam_confidence': min(100, int(total_spam_score * 4))
            }
            
        except Exception as e:
            logger.error(f"댓글 분석 중 오류: {str(e)}")
            return {
                'error': str(e),
                'is_spam': False,
                'spam_confidence': 0
            }
    
    def _analyze_additional_patterns(self, comment_text: str, author_name: str) -> Dict[str, Any]:
        """추가 패턴 분석"""
        patterns = {
            'repeated_chars': len(re.findall(r'(.)\1{3,}', comment_text)) > 0,  # 같은 문자 4번 이상 반복
            'excessive_emojis': len(re.findall(r'[😀-🿿]', comment_text)) > 5,  # 이모지 5개 이상
            'caps_lock_heavy': len(re.findall(r'[A-Z]', comment_text)) > len(comment_text) * 0.5,  # 대문자 50% 이상
            'promotional_phrases': any(phrase in comment_text.lower() for phrase in [
                '구독하고', '좋아요하고', '팔로우하고', '내 채널', '제 채널'
            ]),
            'name_channel_match': any(word in author_name.lower() for word in ['채널', 'tv', '방송']) and any(word in comment_text.lower() for word in ['구독', '좋아요'])
        }
        
        promotional_score = sum(patterns.values())
        
        return {
            'patterns': patterns,
            'promotional_score': promotional_score,
            'is_promotional': promotional_score >= 2
        }