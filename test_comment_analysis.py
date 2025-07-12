#!/usr/bin/env python3
"""
댓글 분석 로직 테스트 스크립트
실제 YouTube 댓글을 다운로드하고 중복/유사 댓글을 분석합니다.
"""

import asyncio
import json
from src.services.youtube_downloader import YouTubeCommentDownloaderService
from src.services.comment_processor import CommentProcessor

async def test_comment_analysis():
    """댓글 분석 전체 플로우 테스트"""
    
    # 서비스 인스턴스 생성
    downloader = YouTubeCommentDownloaderService()
    processor = CommentProcessor()
    
    # 테스트할 YouTube 영상 (유명한 영상으로 댓글이 많은 것)
    test_video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Roll
    
    print("=" * 50)
    print("YouTube 댓글 분석 테스트 시작")
    print("=" * 50)
    
    try:
        # 1. 댓글 다운로드
        print(f"\n📥 댓글 다운로드 중: {test_video_url}")
        comments = await downloader.download_comments(
            video_url=test_video_url,
            limit=50  # 50개 댓글만 테스트
        )
        
        print(f"✅ 다운로드 완료: {len(comments)}개 댓글")
        
        if not comments:
            print("❌ 댓글이 없습니다.")
            return
        
        # 2. 댓글 샘플 출력
        print(f"\n📝 댓글 샘플 (처음 3개):")
        for i, comment in enumerate(comments[:3]):
            print(f"  {i+1}. [{comment['author']}] {comment['text'][:50]}...")
            print(f"     좋아요: {comment['like_count']}, ID: {comment['comment_id']}")
        
        # 3. 완전 중복 댓글 탐지
        print(f"\n🔍 완전 중복 댓글 탐지...")
        exact_duplicates = processor.detect_exact_duplicates(comments)
        
        print(f"✅ 발견된 완전 중복 그룹: {len(exact_duplicates)}개")
        
        if exact_duplicates:
            for i, (hash_key, group) in enumerate(exact_duplicates.items()):
                print(f"\n  그룹 {i+1}: {len(group)}개 중복")
                print(f"    텍스트: '{group[0]['text'][:30]}...'")
                print(f"    댓글 ID들: {[c['comment_id'] for c in group]}")
                print(f"    작성자들: {[c['author'] for c in group]}")
        
        # 4. 유사 댓글 탐지
        print(f"\n🔍 유사 댓글 탐지 (임계값: {processor.similarity_threshold})...")
        similar_groups = processor.detect_similar_duplicates(comments)
        
        print(f"✅ 발견된 유사 댓글 그룹: {len(similar_groups)}개")
        
        if similar_groups:
            for i, group in enumerate(similar_groups):
                print(f"\n  그룹 {i+1}: {len(group)}개 유사")
                print(f"    대표 텍스트: '{group[0]['text'][:30]}...'")
                print(f"    댓글 ID들: {[c['comment_id'] for c in group]}")
                
                # 유사도 계산 결과 표시
                for j, comment in enumerate(group[1:3]):  # 처음 2개만
                    similarity = processor.calculate_similarity(group[0]['text'], comment['text'])
                    print(f"      유사 {j+1}: '{comment['text'][:30]}...' (유사도: {similarity:.3f})")
        
        # 5. 스팸 패턴 분석
        print(f"\n📊 스팸 패턴 분석...")
        spam_patterns = processor.analyze_spam_patterns(comments)
        
        print(f"  완전 중복 그룹: {spam_patterns['exact_duplicates']}개")
        print(f"  유사 그룹: {spam_patterns['similar_groups']}개")
        print(f"  짧은 반복 댓글: {spam_patterns['short_repetitive']}개")
        print(f"  이모지만 댓글: {spam_patterns['emoji_spam']}개")
        print(f"  링크 포함 댓글: {spam_patterns['link_spam']}개")
        
        if spam_patterns['suspicious_authors']:
            print(f"\n  의심스러운 작성자 (상위 3명):")
            for author_info in spam_patterns['suspicious_authors'][:3]:
                print(f"    {author_info['author']}: {author_info['count']}개 댓글")
        
        # 6. 의심스러운 댓글 ID 목록
        suspicious_ids = processor.get_suspicious_comment_ids(comments)
        print(f"\n🚨 의심스러운 댓글 ID 목록: {len(suspicious_ids)}개")
        print(f"  {suspicious_ids[:10]}...")  # 처음 10개만 표시
        
        # 7. 전체 분석 결과
        print(f"\n📋 전체 분석 결과...")
        analysis_result = processor.process_comments(comments)
        
        print(f"  전체 댓글: {analysis_result['total_comments']}개")
        print(f"  의심스러운 댓글: {analysis_result['suspicious_count']}개")
        print(f"  의심 비율: {(analysis_result['suspicious_count']/analysis_result['total_comments']*100):.1f}%")
        
        # 8. 유사도 테스트
        print(f"\n🧮 유사도 계산 테스트...")
        test_texts = [
            ("안녕하세요", "안녕하세요"),  # 동일
            ("좋은 영상이네요", "좋은 영상입니다"),  # 유사
            ("정말 대박이다", "완전히 다른 내용"),  # 다름
        ]
        
        for text1, text2 in test_texts:
            similarity = processor.calculate_similarity(text1, text2)
            print(f"  '{text1}' vs '{text2}': {similarity:.3f}")
        
        print(f"\n✅ 댓글 분석 테스트 완료!")
        
        return analysis_result
        
    except Exception as e:
        print(f"❌ 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()

async def test_with_sample_data():
    """샘플 데이터로 로직 테스트"""
    
    print("\n" + "=" * 50)
    print("샘플 데이터 테스트")
    print("=" * 50)
    
    processor = CommentProcessor()
    
    # 샘플 댓글 데이터 (중복과 유사 댓글 포함)
    sample_comments = [
        {"comment_id": "1", "text": "정말 좋은 영상이네요!", "author": "user1"},
        {"comment_id": "2", "text": "정말 좋은 영상이네요!", "author": "user2"},  # 완전 동일
        {"comment_id": "3", "text": "정말 좋은 영상이네요!", "author": "user3"},  # 완전 동일
        {"comment_id": "4", "text": "정말 좋은 영상입니다", "author": "user4"},   # 유사
        {"comment_id": "5", "text": "좋은 영상이네요 정말", "author": "user5"},   # 유사
        {"comment_id": "6", "text": "완전히 다른 내용의 댓글", "author": "user6"},
        {"comment_id": "7", "text": "ㅋㅋㅋ", "author": "user7"},             # 짧은 댓글
        {"comment_id": "8", "text": "ㅋㅋㅋ", "author": "user8"},             # 짧은 댓글 중복
        {"comment_id": "9", "text": "😂😂😂", "author": "user9"},            # 이모지만
        {"comment_id": "10", "text": "https://example.com 링크", "author": "user10"},  # 링크 포함
    ]
    
    # 분석 실행
    analysis_result = processor.process_comments(sample_comments)
    
    print(f"📊 샘플 데이터 분석 결과:")
    print(f"  전체 댓글: {analysis_result['total_comments']}개")
    print(f"  의심스러운 댓글: {analysis_result['suspicious_count']}개")
    
    # 중복 그룹 상세 정보
    exact_groups = analysis_result['duplicate_groups']['exact_duplicates']['groups']
    print(f"\n  완전 중복 그룹: {len(exact_groups)}개")
    for i, group in enumerate(exact_groups):
        print(f"    그룹 {i+1}: '{group['text_sample']}' - {group['duplicate_count']}개")
        print(f"      ID: {group['comment_ids']}")
    
    similar_groups = analysis_result['duplicate_groups']['similar_groups']['groups']
    print(f"\n  유사 댓글 그룹: {len(similar_groups)}개")
    for i, group in enumerate(similar_groups):
        print(f"    그룹 {i+1}: '{group['representative_text']}' - {group['similar_count']}개")
        print(f"      ID: {group['comment_ids']}")
    
    print(f"\n  의심스러운 댓글 ID: {analysis_result['suspicious_comment_ids']}")
    
    return analysis_result

if __name__ == "__main__":
    print("댓글 분석 로직 테스트 시작...")
    
    # 1. 샘플 데이터 테스트
    asyncio.run(test_with_sample_data())
    
    # 2. 실제 YouTube 댓글 테스트 (네트워크 연결 필요)
    print(f"\n실제 YouTube 댓글 테스트를 진행하시겠습니까? (y/n): ", end="")
    response = input().strip().lower()
    
    if response == 'y':
        asyncio.run(test_comment_analysis())
    else:
        print("실제 테스트는 건너뜁니다.")
    
    print(f"\n🎉 모든 테스트 완료!")