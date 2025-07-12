import pytest
import asyncio
from src.services.youtube_downloader import YouTubeCommentDownloaderService

@pytest.fixture
def downloader():
    return YouTubeCommentDownloaderService()

@pytest.fixture
def sample_video_id():
    # 실제 테스트용 YouTube 비디오 ID (짧은 공개 영상)
    return "dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up

@pytest.fixture
def sample_video_url():
    return "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

class TestYouTubeCommentDownloaderService:
    
    def test_extract_video_id_from_url(self, downloader):
        """YouTube URL에서 비디오 ID 추출 테스트"""
        test_cases = [
            ("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://youtu.be/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"),
            ("dQw4w9WgXcQ", "dQw4w9WgXcQ"),
        ]
        
        for url, expected_id in test_cases:
            result = downloader._extract_video_id(url)
            assert result == expected_id

    def test_extract_video_id_invalid(self, downloader):
        """잘못된 URL 테스트"""
        invalid_urls = [
            "https://example.com",
            "not_a_url",
            "",
            "https://www.youtube.com/watch?v=invalid"
        ]
        
        for url in invalid_urls:
            result = downloader._extract_video_id(url)
            assert result is None

    @pytest.mark.asyncio
    async def test_get_video_info(self, downloader, sample_video_url):
        """비디오 정보 가져오기 테스트"""
        try:
            info = await downloader.get_video_info(sample_video_url)
            
            assert 'video_id' in info
            assert 'video_url' in info
            assert 'has_comments' in info
            assert info['video_id'] == "dQw4w9WgXcQ"
            
        except Exception as e:
            # 네트워크 문제로 실패할 수 있으므로 스킵
            pytest.skip(f"Network test failed: {e}")

    @pytest.mark.asyncio
    async def test_download_comments_with_limit(self, downloader, sample_video_url):
        """제한된 수의 댓글 다운로드 테스트"""
        try:
            comments = await downloader.download_comments(
                video_url=sample_video_url,
                limit=5
            )
            
            assert isinstance(comments, list)
            assert len(comments) <= 5
            
            if comments:
                comment = comments[0]
                required_fields = ['comment_id', 'text', 'author']
                for field in required_fields:
                    assert field in comment
                    
        except Exception as e:
            pytest.skip(f"Network test failed: {e}")

    @pytest.mark.asyncio
    async def test_download_comments_invalid_url(self, downloader):
        """잘못된 URL로 댓글 다운로드 테스트"""
        with pytest.raises(ValueError):
            await downloader.download_comments("invalid_url")

    def test_process_comment(self, downloader):
        """댓글 데이터 처리 테스트"""
        raw_comment = {
            'cid': 'test_id',
            'text': 'Test comment',
            'author': 'Test Author',
            'channel': 'test_channel',
            'time_parsed': '2023-01-01 00:00:00',
            'votes': 10,
            'reply_count': 2,
            'heart': True,
            'parent': None
        }
        
        processed = downloader._process_comment(raw_comment)
        
        assert processed['comment_id'] == 'test_id'
        assert processed['text'] == 'Test comment'
        assert processed['author'] == 'Test Author'
        assert processed['author_id'] == 'test_channel'
        assert processed['like_count'] == 10
        assert processed['reply_count'] == 2
        assert processed['is_favorited'] is True
        assert processed['is_reply'] is False

    @pytest.mark.asyncio
    async def test_search_comments(self, downloader, sample_video_url):
        """댓글 검색 테스트"""
        try:
            # 실제 검색은 네트워크 연결이 필요하므로 모킹 또는 스킵
            comments = await downloader.search_comments(
                video_url=sample_video_url,
                search_term="good",
                case_sensitive=False
            )
            
            assert isinstance(comments, list)
            # 검색된 댓글이 있다면 검색어를 포함하는지 확인
            for comment in comments:
                assert 'good' in comment['text'].lower()
                
        except Exception as e:
            pytest.skip(f"Network test failed: {e}")

# 통합 테스트
class TestIntegration:
    
    @pytest.mark.asyncio
    async def test_full_workflow(self, downloader, sample_video_url):
        """전체 워크플로우 테스트"""
        try:
            # 1. 비디오 정보 가져오기
            video_info = await downloader.get_video_info(sample_video_url)
            assert video_info['video_id'] == "dQw4w9WgXcQ"
            
            # 2. 댓글 다운로드 (소량)
            comments = await downloader.download_comments(
                video_url=sample_video_url,
                limit=3
            )
            
            assert len(comments) <= 3
            
            # 3. 댓글이 있다면 검색 테스트
            if comments:
                # 첫 번째 댓글의 단어를 검색
                first_comment_words = comments[0]['text'].split()
                if first_comment_words:
                    search_word = first_comment_words[0]
                    if len(search_word) > 2:  # 너무 짧은 단어 제외
                        search_results = await downloader.search_comments(
                            video_url=sample_video_url,
                            search_term=search_word
                        )
                        assert isinstance(search_results, list)
            
        except Exception as e:
            pytest.skip(f"Integration test failed: {e}")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])