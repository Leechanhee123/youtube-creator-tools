from typing import List, Dict, Tuple, Set, Optional
import re
import hashlib
from collections import defaultdict, Counter
from difflib import SequenceMatcher
import logging

logger = logging.getLogger(__name__)

class CommentProcessor:
    """댓글 전처리 및 매크로 탐지 서비스"""
    
    def __init__(self):
        self.similarity_threshold = 0.8  # 유사도 임계값
        self.min_duplicate_count = 3    # 최소 중복 개수
        
    def preprocess_text(self, text: str) -> str:
        """텍스트 전처리 (정규화)"""
        if not text:
            return ""
            
        # 소문자 변환
        text = text.lower()
        
        # 특수문자 및 이모지 제거 (한글, 영문, 숫자, 공백만 유지)
        text = re.sub(r'[^\w\sㄱ-ㅎㅏ-ㅣ가-힣]', '', text)
        
        # 연속된 공백을 하나로 변환
        text = re.sub(r'\s+', ' ', text)
        
        # 앞뒤 공백 제거
        text = text.strip()
        
        return text
    
    def calculate_text_hash(self, text: str) -> str:
        """텍스트의 해시값 계산 (완전히 동일한 댓글 탐지용)"""
        normalized_text = self.preprocess_text(text)
        return hashlib.md5(normalized_text.encode('utf-8')).hexdigest()
    
    def calculate_similarity(self, text1: str, text2: str) -> float:
        """두 텍스트 간의 유사도 계산 (0~1)"""
        if not text1 or not text2:
            return 0.0
            
        normalized_text1 = self.preprocess_text(text1)
        normalized_text2 = self.preprocess_text(text2)
        
        if not normalized_text1 or not normalized_text2:
            return 0.0
        
        return SequenceMatcher(None, normalized_text1, normalized_text2).ratio()
    
    def detect_exact_duplicates(self, comments: List[Dict]) -> Dict[str, List[Dict]]:
        """완전히 동일한 댓글 탐지"""
        hash_groups = defaultdict(list)
        
        for comment in comments:
            text_hash = self.calculate_text_hash(comment['text'])
            hash_groups[text_hash].append(comment)
        
        # 중복이 발견된 그룹만 반환
        duplicates = {
            hash_key: group for hash_key, group in hash_groups.items()
            if len(group) >= self.min_duplicate_count
        }
        
        return duplicates
    
    def detect_similar_duplicates(self, comments: List[Dict]) -> List[List[Dict]]:
        """유사한 댓글 그룹 탐지"""
        processed_comments = []
        similar_groups = []
        
        for i, comment in enumerate(comments):
            comment_added = False
            
            # 기존 그룹들과 비교
            for group in similar_groups:
                # 그룹의 첫 번째 댓글과 유사도 비교
                similarity = self.calculate_similarity(
                    comment['text'], 
                    group[0]['text']
                )
                
                if similarity >= self.similarity_threshold:
                    group.append(comment)
                    comment_added = True
                    break
            
            # 어떤 그룹에도 속하지 않으면 새 그룹 생성
            if not comment_added:
                similar_groups.append([comment])
        
        # 최소 개수 이상의 댓글이 있는 그룹만 반환
        return [
            group for group in similar_groups 
            if len(group) >= self.min_duplicate_count
        ]
    
    def analyze_spam_patterns(self, comments: List[Dict]) -> Dict:
        """스팸/매크로 패턴 분석"""
        patterns = {
            'exact_duplicates': 0,
            'similar_groups': 0,
            'suspicious_authors': [],
            'common_phrases': [],
            'short_repetitive': 0,
            'emoji_spam': 0,
            'link_spam': 0
        }
        
        # 1. 완전 중복 댓글 분석
        exact_duplicates = self.detect_exact_duplicates(comments)
        patterns['exact_duplicates'] = len(exact_duplicates)
        
        # 2. 유사 댓글 그룹 분석
        similar_groups = self.detect_similar_duplicates(comments)
        patterns['similar_groups'] = len(similar_groups)
        
        # 3. 의심스러운 작성자 분석 (동일 사용자가 많은 댓글 작성)
        author_counts = Counter(comment['author'] for comment in comments)
        suspicious_threshold = max(3, len(comments) * 0.1)  # 전체의 10% 또는 최소 3개
        patterns['suspicious_authors'] = [
            {'author': author, 'count': count}
            for author, count in author_counts.most_common(10)
            if count >= suspicious_threshold
        ]
        
        # 4. 짧고 반복적인 댓글 (3글자 이하)
        patterns['short_repetitive'] = sum(
            1 for comment in comments 
            if len(self.preprocess_text(comment['text'])) <= 3
        )
        
        # 5. 이모지만 있는 댓글
        emoji_pattern = re.compile(r'^[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF\s]*$')
        patterns['emoji_spam'] = sum(
            1 for comment in comments 
            if emoji_pattern.match(comment['text'])
        )
        
        # 6. 링크가 포함된 댓글
        link_pattern = re.compile(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+')
        patterns['link_spam'] = sum(
            1 for comment in comments 
            if link_pattern.search(comment['text'])
        )
        
        # 7. 자주 등장하는 구문 분석
        all_text = ' '.join(comment['text'] for comment in comments)
        words = re.findall(r'\b\w+\b', all_text.lower())
        word_counts = Counter(words)
        patterns['common_phrases'] = [
            {'phrase': word, 'count': count}
            for word, count in word_counts.most_common(10)
            if count >= 5 and len(word) > 2
        ]
        
        return patterns
    
    def get_duplicate_groups(self, comments: List[Dict]) -> Dict:
        """중복 댓글 그룹핑 결과 반환"""
        exact_duplicates = self.detect_exact_duplicates(comments)
        similar_groups = self.detect_similar_duplicates(comments)
        
        return {
            'exact_duplicates': {
                'count': len(exact_duplicates),
                'groups': [
                    {
                        'text_sample': group[0]['text'],
                        'duplicate_count': len(group),
                        'comment_ids': [comment['comment_id'] for comment in group],
                        'authors': list(set(comment['author'] for comment in group))
                    }
                    for group in exact_duplicates.values()
                ]
            },
            'similar_groups': {
                'count': len(similar_groups),
                'groups': [
                    {
                        'representative_text': group[0]['text'],
                        'similar_count': len(group),
                        'comment_ids': [comment['comment_id'] for comment in group],
                        'authors': list(set(comment['author'] for comment in group)),
                        'similarity_samples': [
                            {
                                'text': comment['text'],
                                'similarity': self.calculate_similarity(group[0]['text'], comment['text'])
                            }
                            for comment in group[1:3]  # 처음 2개만 샘플로
                        ]
                    }
                    for group in similar_groups
                ]
            }
        }
    
    def get_suspicious_comment_ids(self, comments: List[Dict]) -> List[str]:
        """의심스러운 댓글 ID 목록 반환"""
        suspicious_ids = set()
        
        # 완전 중복 댓글 ID 수집
        exact_duplicates = self.detect_exact_duplicates(comments)
        for group in exact_duplicates.values():
            for comment in group:
                suspicious_ids.add(comment['comment_id'])
        
        # 유사 댓글 그룹의 ID 수집
        similar_groups = self.detect_similar_duplicates(comments)
        for group in similar_groups:
            for comment in group:
                suspicious_ids.add(comment['comment_id'])
        
        return list(suspicious_ids)
    
    def process_comments(self, comments: List[Dict]) -> Dict:
        """댓글 전체 처리 및 분석 결과 반환"""
        if not comments:
            return {
                'total_comments': 0,
                'suspicious_count': 0,
                'duplicate_groups': {'exact_duplicates': {'count': 0, 'groups': []}, 'similar_groups': {'count': 0, 'groups': []}},
                'spam_patterns': {},
                'suspicious_comment_ids': []
            }
        
        spam_patterns = self.analyze_spam_patterns(comments)
        duplicate_groups = self.get_duplicate_groups(comments)
        suspicious_ids = self.get_suspicious_comment_ids(comments)
        
        return {
            'total_comments': len(comments),
            'suspicious_count': len(suspicious_ids),
            'duplicate_groups': duplicate_groups,
            'spam_patterns': spam_patterns,
            'suspicious_comment_ids': suspicious_ids,
            'processing_summary': {
                'exact_duplicate_groups': duplicate_groups['exact_duplicates']['count'],
                'similar_groups': duplicate_groups['similar_groups']['count'],
                'suspicious_authors': len(spam_patterns['suspicious_authors']),
                'spam_indicators': {
                    'short_repetitive': spam_patterns['short_repetitive'],
                    'emoji_only': spam_patterns['emoji_spam'],
                    'contains_links': spam_patterns['link_spam']
                }
            }
        }