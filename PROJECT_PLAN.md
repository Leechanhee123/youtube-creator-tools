# YouTube 프로젝트 계획서

## 📋 프로젝트 개요

### 프로젝트명
YouTube Creator Tools - 매크로 댓글 관리 및 채널 분석 도구

### 현재 상황
- FastAPI 백엔드 기본 구조 완료
- Supabase 연결 설정 완료
- WebSocket 지원 준비 완료

---

## 🎯 프로젝트 목표 및 범위

### 주요 목표
> **이 섹션을 함께 작성해주세요**

   1. youtube comment donwloader를 이용한 AI를 이용한 매크로 댓글 탐색 및 id 파싱
   2. youtube data api를 이용한 1번의 id 파싱값으로 댓글 삭제기능
   3. youtube data api를 이용한 SEO 및 채널의 개선점 비교점 탐색 및 구현
   4. Auth2.0 인증을 통한 개인 유튜브 세부탐색(소셜 로그인 구현)

### 프로젝트 범위
- **포함할 기능:**
  - ✅ YouTube Comment Downloader 연동
  - ✅ AI 기반 매크로 댓글 탐지
  - ✅ YouTube Data API 연동 (댓글 삭제)
  - ✅ OAuth 2.0 인증 (YouTube 계정 연동)
  - ✅ SEO 및 채널 분석 기능
  - ✅ 실시간 처리 상태 알림 (WebSocket)

- **제외할 기능:**
  - ❌ 영상 업로드/편집 기능
  - ❌ 실시간 스트리밍 관련 기능
  - ❌ 수익화 관련 기능

### 타겟 사용자
> **누가 이 서비스를 사용할 예정인가요?**
유튜브 크리에이터
---

## 🛠 기술 스택 (현재 설정 완료)

### Backend
- **Framework:** FastAPI 0.104.1
- **WebSocket:** 내장 WebSocket 지원
- **Database:** Supabase (PostgreSQL)
- **Cache:** Redis (선택적)
- **Server:** Uvicorn

### Frontend (향후 계획)
- **Framework:** react or 다른언어
- **State Management:** 미정
- **Styling:** tailwind or css

### DevOps
- **Containerization:** git (필요시)
- **Deployment:** git

---

## 🏗 시스템 아키텍처

### 현재 구조
```
youtube/
├── src/
│   ├── api/          # API 라우트
│   ├── core/         # 설정, DB 연결
│   ├── models/       # 데이터 모델
│   ├── services/     # 비즈니스 로직
│   └── utils/        # 유틸리티
├── tests/            # 테스트
└── main.py          # 애플리케이션 진입점
```

### 데이터 플로우
> **데이터가 어떻게 흘러갈 예정인가요?**
1. comment donwloader를 이용한 댓글 파싱 후 반복되는 댓글 탐색 후 id 파싱
2. id를 list로넘겨 youtue data api를 이용한 댓글 삭제
3. youtube data api를 이용한 조회(독립적)
4. 소셜로그인 구현(독립적)
---

## 📅 개발 로드맵

### Phase 1: 기본 설정 (완료)
- [x] FastAPI 프로젝트 구조 설정
- [x] Supabase 연결 설정
- [x] WebSocket 기본 구현

### Phase 2: 핵심 기능 개발 (진행 중)
- [x] YouTube Comment Downloader 패키지 설치 및 테스트
- [x] AI 매크로 댓글 탐지 알고리즘 구현
- [x] YouTube Data API 연동 및 기본 기능 구현
- [ ] OAuth 2.0 인증 구현 (YouTube 계정 연동)
- [ ] 댓글 삭제 기능 구현 (YouTube Data API)
- [x] API 문서화

### Phase 3: 프론트엔드 개발 (계획 중)
- [ ] 프론트엔드 프레임워크 선택
- [ ] UI/UX 디자인
- [ ] 백엔드 연동

### Phase 4: 배포 및 최적화 (계획 중)
- [ ] 배포 환경 설정
- [ ] 성능 최적화
- [ ] 모니터링 설정

---

## ❓ 논의 필요한 사항

1. **프로젝트의 구체적인 목적은 무엇인가요?**
   youtube 크레에이터를 위한 매크로 댓글 삭제
   youtube 크레에이터를 위한 채널 개선점 SEO 등의 지표작성

2. **어떤 YouTube 관련 기능을 구현하고 싶으신가요?**
   댓글 삭제 시스템
   데이터 분석을 통한 개선점 제시

3. **사용자 규모는 어느 정도로 예상하시나요?**
   크리에이터(소규모)

4. **프론트엔드는 어떤 형태로 구현하실 예정인가요?**
   웹 먼저 작성 추후 앱 개발도 생각중

---

## 📊 데이터베이스 설계 (예정)

### 주요 테이블 (Supabase)
- **users** - 사용자 정보 및 OAuth 데이터
- **channels** - 연동된 YouTube 채널 정보
- **comments** - 다운로드한 댓글 데이터
- **spam_detection** - AI 탐지 결과 및 패턴
- **deletion_logs** - 삭제된 댓글 로그
- **analytics** - 채널 분석 데이터

---

## 🔌 API 설계 (예정)

### 주요 엔드포인트
- **POST /api/v1/auth/youtube** - YouTube OAuth 인증
- **POST /api/v1/comments/download** - 댓글 다운로드
- **POST /api/v1/comments/analyze** - 매크로 댓글 분석
- **DELETE /api/v1/comments/bulk** - 댓글 일괄 삭제
- **GET /api/v1/analytics/channel** - 채널 분석 데이터
- **WebSocket /ws/processing** - 실시간 처리 상태

---

## 🧪 테스트 전략

### 테스트 우선순위
1. **API 테스트** - YouTube Data API 연동
2. **댓글 분석 로직** - AI 탐지 정확도
3. **OAuth 인증** - 보안 테스트
4. **대용량 처리** - 성능 테스트

---

## 🛡 보안 고려사항

### OAuth 2.0 보안
- YouTube API 키 안전한 저장
- 액세스 토큰 갱신 로직
- 사용자 권한 최소화 원칙

### 데이터 보호
- 개인정보 암호화 저장
- 댓글 데이터 임시 저장 후 삭제
- 로그 데이터 익명화

---

## 📝 현재 개발 현황

### ✅ **완료된 기능**
1. **프로젝트 기본 구조** - FastAPI + Supabase + WebSocket
2. **YouTube Comment Downloader** - 댓글 다운로드, 검색, 파싱
3. **AI 매크로 댓글 탐지** - 중복/유사 댓글 분석, 스팸 패턴 탐지
4. **YouTube Data API 연동** - 채널 정보, 비디오 목록, 통계 조회
5. **React 프론트엔드 구축** - TypeScript + Ant Design + React Query
6. **API 서비스 클래스** - 백엔드 API 연동을 위한 서비스 계층
7. **상태 관리 시스템** - 커스텀 훅 기반 상태 관리
8. **댓글 분석 UI** - 매크로 댓글 탐지 결과 시각화
9. **한국어 URL 처리** - 한국어 채널명 지원을 위한 URL 인코딩/디코딩
10. **직접 비디오 URL 분석** - 채널 분석 없이 개별 비디오 댓글 분석
11. **분석 설정 UI** - 댓글 다운로드 수, 유사도 임계값, 중복 개수 설정
12. **전체 댓글 분석** - 제한 없는 댓글 다운로드 및 분석
13. **SEO 분석 시스템 구현** - 상위/하위 조회수 비교 분석 로직
14. **SEO 분석 UI** - 제목, 설명, 업로드 시간 패턴 시각화
15. **개선 제안 시스템** - 우선순위별 SEO 최적화 제안

### 🔄 **진행 중인 작업**
1. **고급 분석 기능 개발** - 경쟁사 분석, 키워드 트렌드, 썸네일 분석 (0% 시작)
2. **OAuth 2.0 인증 구현** (YouTube 계정 연동)
3. **댓글 삭제 기능 구현** (YouTube Data API)
4. **UI/UX 개선** (스타일 및 사용성 향상)

### ✅ **최근 해결된 이슈**
- **SEO 라우터 404 에러**: YouTube API 응답 구조 불일치로 인한 문제 해결 완료
- **API 구조 수정**: `videos_data.get('videos')` → `videos_data.get('data', {}).get('videos')` 형태로 수정
- **페이지네이션 지원**: YouTube API에서 `page_token` 매개변수 추가 지원

### 📊 **개발 진척도**
- **백엔드 기본 기능**: 100% 완료
- **API 연동**: 100% 완료  
- **프론트엔드 기본 기능**: 98% 완료
- **댓글 분석 시스템**: 100% 완료
- **SEO 분석 시스템**: 100% 완료
- **고급 분석 기능**: 0% (새로 추가)
- **인증 시스템**: 0% (미착수)
- **댓글 삭제 기능**: 0% (OAuth 연동 후 구현)
- **UI/UX**: 92% 완료

### 📋 **최근 진행 사항 (2025-01-11)**
1. **SEO 분석 백엔드 완료**
   - `SEOAnalyzer` 클래스 구현 (조회수 기반 비교 분석)
   - 제목/설명/업로드 시간 패턴 분석
   - 한국어/영어 키워드 패턴 지원
   - 우선순위별 개선 제안 생성

2. **SEO 분석 프론트엔드 완료**
   - `SEOAnalysisResult` 컴포넌트 구현
   - 대시보드에 SEO 분석 탭 추가
   - 상세 비교 분석 UI (제목, 설명, 타이밍)
   - 개선 제안 시각화

3. **해결 필요한 이슈**
   - SEO 라우터 연결 문제 (404 에러)
   - 백엔드 모듈 import 경로 확인 필요

---

## 🎯 **고급 분석 기능 개발 계획 (새로 추가)**

### **1. 🏆 경쟁사 분석 (Competitor Analysis)**

#### **목적 및 핵심 가치**
- **모니터링 중심**: 유사 채널의 성과 패턴 실시간 추적
- **전략적 인사이트**: 경쟁사 대비 우위/열위 요소 파악
- **벤치마킹**: 성공하는 경쟁사의 콘텐츠 전략 분석

#### **구현 기능**
```python
# 새로운 API 엔드포인트
POST /api/v1/advanced/competitor-analysis
{
  "target_channel_id": "UCxxxxxx",
  "competitor_keywords": ["게임", "리뷰"],
  "analysis_period": "30d",  // 7d, 30d, 90d
  "comparison_metrics": ["views", "engagement", "upload_frequency"]
}

# 응답 데이터
{
  "target_channel": {...},
  "competitors": [
    {
      "channel_id": "UCyyyyyy",
      "similarity_score": 0.85,
      "performance_comparison": {
        "avg_views_ratio": 1.3,  // 경쟁사가 30% 더 높음
        "engagement_ratio": 0.9,
        "upload_frequency_ratio": 1.5
      },
      "content_insights": {
        "successful_title_patterns": ["✨", "🔥", "리뷰"],
        "optimal_video_length": "10-15분",
        "peak_upload_times": ["19:00-21:00"]
      }
    }
  ],
  "strategic_recommendations": [
    {
      "priority": "high",
      "type": "content_strategy",
      "suggestion": "경쟁사 대비 업로드 빈도 증가 필요 (주 3회 → 주 5회)"
    }
  ]
}
```

#### **모니터링 대시보드**
- **실시간 경쟁사 순위**: 구독자/조회수 기준 상대적 위치
- **성과 비교 차트**: 시간대별 성장률 비교
- **콘텐츠 갭 분석**: 경쟁사는 다루지만 내가 안 다루는 주제
- **트렌드 알림**: 경쟁사 급성장 콘텐츠 실시간 알림

### **2. 📈 키워드 트렌드 분석 (Keyword Trend Analysis)**

#### **목적 및 핵심 가치**  
- **실시간 트렌드 캐치**: 상승세 키워드 조기 발견
- **SEO 최적화**: 검색량 높은 키워드 기반 콘텐츠 기획
- **성과 예측**: 키워드 트렌드 기반 조회수 예측

#### **구현 기능**
```python
# 새로운 API 엔드포인트
GET /api/v1/advanced/keyword-trends
?category=gaming&period=7d&region=KR

# 응답 데이터
{
  "trending_keywords": [
    {
      "keyword": "신작 게임",
      "trend_score": 95,  // 0-100
      "search_volume_change": "+150%",
      "competition_level": "medium",
      "opportunity_score": 88,
      "related_videos_performance": {
        "avg_views": 50000,
        "success_rate": 0.7  // 70%의 비디오가 평균 이상 성과
      }
    }
  ],
  "declining_keywords": [...],
  "seasonal_insights": {
    "peak_months": ["12월", "1월"],
    "recommended_timing": "12월 초 콘텐츠 준비 권장"
  },
  "personalized_recommendations": [
    {
      "suggested_keyword": "인디 게임 리뷰",
      "reason": "채널 특성 + 상승 트렌드 일치",
      "estimated_views": "10K-25K",
      "confidence": 0.82
    }
  ]
}
```

#### **트렌드 모니터링 시스템**
- **키워드 추적 리스트**: 관심 키워드 등록 및 알림
- **트렌드 예측**: 과거 패턴 기반 미래 트렌드 예측
- **콘텐츠 추천**: 트렌드 키워드 기반 주제 제안
- **최적 타이밍**: 키워드별 최적 업로드 시기 안내

### **3. 🖼️ 썸네일 분석 (Thumbnail Analysis)**

#### **목적 및 핵심 가치**
- **클릭률 최적화**: 썸네일-클릭률 상관관계 분석
- **A/B 테스트**: 다양한 썸네일 스타일 성과 비교
- **디자인 인사이트**: 성공하는 썸네일의 시각적 패턴

#### **구현 기능**
```python
# 새로운 API 엔드포인트  
POST /api/v1/advanced/thumbnail-analysis
{
  "channel_id": "UCxxxxxx",
  "analysis_type": "style_performance",  // style_performance, ab_test, competitor_comparison
  "video_count": 50
}

# 응답 데이터
{
  "style_analysis": {
    "high_performing_elements": [
      {
        "element": "얼굴 표정",
        "type": "과장된 놀람",
        "avg_ctr_boost": "+23%",
        "confidence": 0.89
      },
      {
        "element": "색상 팔레트", 
        "type": "고대비 (빨강+파랑)",
        "avg_ctr_boost": "+18%",
        "confidence": 0.76
      }
    ],
    "optimal_text_ratio": "15-20%",  // 썸네일 대비 텍스트 비율
    "best_face_position": "우상단",
    "color_psychology": {
      "빨강": "긴급성, 주목도 높음",
      "파랑": "신뢰성, 안정감"
    }
  },
  "performance_correlation": {
    "thumbnail_ctr": 0.67,  // 썸네일-클릭률 상관계수
    "view_duration_impact": "+12%",  // 좋은 썸네일이 시청 지속시간에 미치는 영향
    "engagement_boost": "+8%"
  },
  "improvement_suggestions": [
    {
      "current_issue": "얼굴 표정이 단조로움",
      "suggestion": "과장된 감정 표현 추가 권장",
      "expected_improvement": "+15% CTR",
      "difficulty": "쉬움"
    }
  ]
}
```

#### **썸네일 최적화 도구**
- **스타일 점수**: 썸네일별 성과 예측 점수
- **요소 분석**: 얼굴, 텍스트, 색상, 배경 등 개별 요소 성과 분석
- **A/B 테스트 추천**: 다양한 썸네일 변형 제안
- **업계 벤치마크**: 동일 카테고리 상위 채널 썸네일 분석

### **4. 📊 통합 모니터링 대시보드**

#### **실시간 성과 모니터링**
```javascript
// 대시보드 구성
{
  "performance_alerts": [
    {
      "type": "competitor_surge",
      "message": "경쟁사 Channel A가 지난 24시간 내 급성장 (+50K views)",
      "action": "해당 콘텐츠 분석 권장"
    },
    {
      "type": "keyword_opportunity", 
      "message": "'신작 리뷰' 키워드 검색량 급증 (+200%)",
      "action": "관련 콘텐츠 제작 권장"
    }
  ],
  "weekly_insights": {
    "best_performing_elements": ["과장된 썸네일", "트렌드 키워드 활용"],
    "improvement_areas": ["업로드 일정", "영상 길이 최적화"],
    "next_week_recommendations": [...]
  }
}
```

### **5. 🔄 추후 모니터링 시스템 확장 계획**

#### **실시간 알림 시스템**
- **급상승 콘텐츠 알림**: 내 채널/경쟁사 급성장 감지
- **트렌드 변화 알림**: 키워드 검색량 급변 시 즉시 알림  
- **성과 임계값 알림**: 목표 지표 달성/미달 시 알림

#### **예측 분석**
- **조회수 예측**: 썸네일+제목+키워드 기반 성과 예측
- **최적 업로드 시간**: 개인 채널 맞춤 최적 시간 계산
- **콘텐츠 라이프사이클**: 주제별 인기 지속 기간 예측

#### **자동화 제안**
- **콘텐츠 캘린더**: 트렌드 기반 자동 콘텐츠 일정 생성
- **제목 자동 최적화**: AI 기반 SEO 친화적 제목 제안
- **썸네일 템플릿**: 성과 좋은 썸네일 스타일 템플릿 제공

---

## 🔌 API 엔드포인트 명세 (Frontend 연동용)

### Base URL
```
http://localhost:8000/api/v1
```

### 1. YouTube Comment Downloader API

#### 📥 댓글 다운로드
```http
POST /youtube/comments/download
Content-Type: application/json

Request Body:
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "limit": 50,              // 선택사항 (기본값: 전체)
  "language": "ko",         // 선택사항 (기본값: "ko")
  "sort_by": "top"          // "top" 또는 "new"
}

Response:
{
  "success": true,
  "message": "Successfully downloaded 50 comments",
  "video_info": {
    "video_id": "VIDEO_ID",
    "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
    "has_comments": true
  },
  "comments": [
    {
      "comment_id": "comment_123",
      "text": "댓글 내용",
      "author": "작성자명",
      "author_id": "channel_id",
      "timestamp": "2023-01-01T00:00:00",
      "like_count": 10,
      "reply_count": 2,
      "is_favorited": false,
      "is_reply": false,
      "parent_id": null
    }
  ],
  "total_count": 50
}
```

#### 🔍 댓글 검색
```http
POST /youtube/comments/search
Content-Type: application/json

Request Body:
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "search_term": "검색어",
  "case_sensitive": false
}
```

#### ℹ️ 비디오 정보 조회
```http
GET /youtube/video/info?video_url=VIDEO_URL
```

### 2. YouTube Data API (크리에이터 정보)

#### 📊 채널 정보 조회
```http
POST /youtube-data/channel/info
Content-Type: application/json

Request Body:
{
  "url": "https://www.youtube.com/@username"
  // 또는 아래 중 하나
  // "channel_id": "UCxxxxxx",
  // "username": "username", 
  // "handle": "@handle"
}

Response:
{
  "success": true,
  "message": "Channel information retrieved successfully",
  "data": {
    "channel_id": "UCxxxxxx",
    "title": "채널명",
    "description": "채널 설명",
    "custom_url": "@username",
    "published_at": "2020-01-01T00:00:00Z",
    "statistics": {
      "view_count": 1000000,
      "subscriber_count": 50000,
      "video_count": 100
    },
    "thumbnails": {
      "default": {"url": "https://..."},
      "medium": {"url": "https://..."},
      "high": {"url": "https://..."}
    }
  }
}
```

#### 📹 채널 비디오 목록 조회
```http
GET /youtube-data/channel/{channel_id}/videos?max_results=20&order=date

Response:
{
  "success": true,
  "message": "Retrieved 20 videos",
  "data": {
    "videos": [
      {
        "video_id": "dQw4w9WgXcQ",
        "title": "비디오 제목",
        "description": "비디오 설명",
        "published_at": "2023-01-01T00:00:00Z",
        "video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "thumbnails": {...}
      }
    ],
    "total_results": 100,
    "next_page_token": "NEXT_PAGE_TOKEN"
  }
}
```

#### 📈 비디오 상세 통계
```http
GET /youtube-data/video/{video_id}/statistics

Response:
{
  "success": true,
  "data": {
    "video_id": "dQw4w9WgXcQ",
    "title": "비디오 제목",
    "statistics": {
      "view_count": 100000,
      "like_count": 5000,
      "comment_count": 500
    },
    "status": {
      "privacy_status": "public",
      "upload_status": "processed"
    },
    "tags": ["tag1", "tag2"]
  }
}
```

#### 🔍 채널 검색
```http
GET /youtube-data/channels/search?q=검색어&max_results=10

Response:
{
  "success": true,
  "data": {
    "channels": [
      {
        "channel_id": "UCxxxxxx",
        "title": "채널명",
        "description": "채널 설명",
        "channel_url": "https://www.youtube.com/channel/UCxxxxxx"
      }
    ]
  }
}
```

### 3. Comment Processor API (매크로 탐지)

#### 🤖 영상 댓글 전체 분석
```http
POST /processor/analyze-video
Content-Type: application/json

Request Body:
{
  "video_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "download_limit": 100,           // 선택사항
  "similarity_threshold": 0.8,     // 유사도 임계값 (0.0~1.0)
  "min_duplicate_count": 3         // 중복으로 간주할 최소 개수
}

Response:
{
  "success": true,
  "message": "Successfully analyzed 100 comments. Found 15 suspicious comments.",
  "video_id": "VIDEO_ID",
  "total_comments": 100,
  "suspicious_count": 15,
  "duplicate_groups": {
    "exact_duplicates": {
      "count": 2,
      "groups": [
        {
          "text_sample": "첫 번째!",
          "duplicate_count": 5,
          "comment_ids": ["id1", "id2", "id3", "id4", "id5"],
          "authors": ["user1", "user2", "user3"]
        }
      ]
    },
    "similar_groups": {
      "count": 1,
      "groups": [...]
    }
  },
  "spam_patterns": {
    "exact_duplicates": 2,
    "similar_groups": 1,
    "suspicious_authors": [
      {"author": "spammer1", "count": 10}
    ],
    "short_repetitive": 5,
    "emoji_spam": 3,
    "link_spam": 2
  },
  "suspicious_comment_ids": ["id1", "id2", "id3", ...],
  "processing_summary": {
    "exact_duplicate_groups": 2,
    "similar_groups": 1,
    "suspicious_authors": 1,
    "spam_indicators": {
      "short_repetitive": 5,
      "emoji_only": 3,
      "contains_links": 2
    }
  }
}
```

#### 📊 댓글 데이터 직접 분석
```http
POST /processor/analyze-comments
Content-Type: application/json

Request Body:
{
  "comments": [
    {
      "comment_id": "123",
      "text": "댓글 내용",
      "author": "작성자"
    }
  ],
  "similarity_threshold": 0.8,
  "min_duplicate_count": 3
}
```

#### 🧮 텍스트 유사도 계산
```http
GET /processor/similarity/{text1}/{text2}

Response:
{
  "success": true,
  "text1": "첫번째 텍스트",
  "text2": "두번째 텍스트",
  "similarity": 0.85,
  "is_similar": true,
  "threshold": 0.8
}
```

#### ⚙️ 분석 설정 조회/수정
```http
GET /processor/settings

PUT /processor/settings
Content-Type: application/json
{
  "similarity_threshold": 0.75,
  "min_duplicate_count": 4
}
```

### 4. 시스템 상태 API

#### 🏥 서비스 상태 확인
```http
GET /status                      // 전체 API 상태
GET /youtube/health             // YouTube 다운로더 상태
GET /processor/health           // 프로세서 상태
GET /youtube-data/health        // YouTube Data API 상태
GET /youtube-data/test          // YouTube API 키 테스트
GET /db-test                    // 데이터베이스 연결 상태
```

### 5. WebSocket 연결 (실시간 처리 상태)

#### 📡 실시간 처리 상태 수신
```javascript
// WebSocket 연결
const ws = new WebSocket('ws://localhost:8000/ws');

// 메시지 수신
ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // 처리 상태 업데이트
};

// 메시지 송신 예시
ws.send(JSON.stringify({
  type: 'start_analysis',
  video_url: 'VIDEO_URL'
}));
```

### 6. 향후 구현 예정 API

#### 🔐 OAuth 2.0 인증 (YouTube 계정 연동)
```http
POST /auth/youtube/login      // YouTube OAuth 시작
GET /auth/youtube/callback    // OAuth 콜백
POST /auth/youtube/refresh    // 토큰 갱신
DELETE /auth/logout           // 로그아웃
```

#### 🗑️ 댓글 삭제 (YouTube Data API)
```http
DELETE /youtube/comments/bulk
Content-Type: application/json
{
  "comment_ids": ["id1", "id2", "id3"],
  "access_token": "user_oauth_token"
}
```

#### 📈 채널 분석 (SEO)
```http
GET /analytics/channel/{channel_id}
POST /analytics/compare
```

---

## 📱 Frontend 개발 가이드

### 🔄 **주요 데이터 플로우**

#### **1. 채널 분석 플로우**
```javascript
// 1단계: 채널 URL 입력 및 정보 조회
const channelInfo = await fetch('/api/v1/youtube-data/channel/info', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://www.youtube.com/@username' })
});

// 2단계: 채널 비디오 목록 조회
const videos = await fetch(`/api/v1/youtube-data/channel/${channelId}/videos`);

// 3단계: 특정 비디오 선택 후 댓글 분석
const analysis = await fetch('/api/v1/processor/analyze-video', {
  method: 'POST',
  body: JSON.stringify({
    video_url: 'https://www.youtube.com/watch?v=VIDEO_ID',
    download_limit: 100
  })
});
```

#### **2. 매크로 댓글 탐지 플로우**
```javascript
// 1단계: 비디오 URL로 댓글 다운로드 + 분석
const result = await fetch('/api/v1/processor/analyze-video', {
  method: 'POST',
  body: JSON.stringify({
    video_url: videoUrl,
    similarity_threshold: 0.8,
    min_duplicate_count: 3
  })
});

// 2단계: 분석 결과 처리
const {
  suspicious_comment_ids,      // 삭제 대상 댓글 ID들
  duplicate_groups,            // 중복 댓글 그룹
  spam_patterns,              // 스팸 패턴 통계
  processing_summary          // 요약 정보
} = result.data;

// 3단계: 사용자에게 결과 표시 및 선택 받기
// 4단계: 선택된 댓글들 일괄 삭제 (구현 예정)
```

### 📊 **권장 UI 구성**

#### **대시보드 페이지**
```
┌─────────────────────────────────────┐
│ 🎯 YouTube Creator Tools           │
├─────────────────────────────────────┤
│ 📊 Channel URL Input                │
│ [https://www.youtube.com/@user....] │
│ [Analyze Channel] [Search Videos]   │
├─────────────────────────────────────┤
│ 📈 Channel Statistics               │
│ • Subscribers: 50K                  │
│ • Videos: 100                       │
│ • Total Views: 1M                   │
└─────────────────────────────────────┘
```

#### **비디오 목록 페이지**
```
┌─────────────────────────────────────┐
│ 📹 Channel Videos                   │
├─────────────────────────────────────┤
│ [🎥] Video Title 1 | 👁️ 10K | 💬 500   │ [Analyze Comments]
│ [🎥] Video Title 2 | 👁️ 5K  | 💬 200   │ [Analyze Comments]  
│ [🎥] Video Title 3 | 👁️ 8K  | 💬 300   │ [Analyze Comments]
└─────────────────────────────────────┘
```

#### **댓글 분석 결과 페이지**
```
┌─────────────────────────────────────┐
│ 🤖 Comment Analysis Results        │
├─────────────────────────────────────┤
│ 📊 Summary                          │
│ • Total Comments: 500               │
│ • Suspicious: 45 (9%)               │
│ • Duplicate Groups: 3               │
├─────────────────────────────────────┤
│ 🚨 Duplicate Groups                 │
│ Group 1: "첫 번째!" (15 comments)     │
│ ├─ user1, user2, user3...           │
│ ├─ [Select All] [Preview]           │
│                                     │
│ Group 2: "좋은 영상" (8 comments)      │
│ ├─ user4, user5, user6...           │
│ ├─ [Select All] [Preview]           │
├─────────────────────────────────────┤
│ [Delete Selected] [Export Report]   │
└─────────────────────────────────────┘
```

### 🔧 **상태 관리 권장사항**

#### **React 상태 구조 예시**
```javascript
const [appState, setAppState] = useState({
  // 채널 정보
  channel: {
    info: null,
    videos: [],
    loading: false
  },
  
  // 댓글 분석
  analysis: {
    currentVideo: null,
    results: null,
    selectedComments: [],
    loading: false
  },
  
  // 설정
  settings: {
    similarity_threshold: 0.8,
    min_duplicate_count: 3
  },
  
  // UI 상태
  ui: {
    activeTab: 'dashboard',
    notifications: []
  }
});
```

#### **WebSocket 상태 관리**
```javascript
useEffect(() => {
  const ws = new WebSocket('ws://localhost:8000/ws');
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch(data.type) {
      case 'analysis_progress':
        setProgress(data.progress);
        break;
      case 'analysis_complete':
        setResults(data.results);
        break;
    }
  };
}, []);
```

### 📈 **성능 최적화 권장사항**

1. **가상화**: 댓글 목록이 많을 때 `react-window` 사용
2. **페이지네이션**: 비디오 목록 페이징 처리
3. **캐싱**: 채널 정보 로컬 스토리지 캐싱
4. **Debouncing**: 검색 입력 디바운싱
5. **Lazy Loading**: 비디오 썸네일 지연 로딩

### 🎨 **UI/UX 고려사항**

1. **진행 상태 표시**: 분석 중 로딩 스피너 및 진행률
2. **결과 시각화**: 차트로 스팸 비율 표시
3. **미리보기**: 삭제 전 댓글 내용 확인 가능
4. **실행 취소**: 실수로 삭제한 경우 복구 기능
5. **배치 작업**: 여러 비디오 동시 분석 지원

---

## 🎨 **프론트엔드 구현 현황**

### **기술 스택**
- **Framework**: React 18 + TypeScript
- **UI Library**: Ant Design 5.x
- **상태 관리**: React Query + Custom Hooks
- **HTTP Client**: Axios
- **빌드 도구**: Vite
- **스타일링**: Ant Design + CSS

### **구현된 컴포넌트**
1. **Dashboard 페이지**
   - 채널 URL 입력 및 분석
   - 채널 정보 표시 (구독자, 조회수, 비디오 수)
   - 통계 카드 (분석된 채널, 로드된 비디오 등)

2. **비디오 목록 페이지**
   - 채널 비디오 목록 테이블
   - 썸네일, 제목, 통계 정보 표시
   - 개별 비디오 댓글 분석 버튼

3. **댓글 분석 결과 페이지**
   - 분석 요약 (전체 댓글 수, 의심 댓글 수, 스팸 비율, 위험도)
   - 스팸 패턴 분석 (중복, 유사, 의심 사용자, 반복 댓글, 이모지/링크 스팸)
   - 중복 댓글 그룹 테이블 (완전 중복 / 유사 그룹)
   - 댓글 선택 및 삭제 인터페이스
   - 의심 사용자 목록
   - 그룹별 미리보기 기능

4. **비디오 URL 직접 분석**
   - 채널 분석 없이 개별 비디오 URL로 댓글 분석
   - 분석 설정 (댓글 수 제한, 유사도 임계값, 최소 중복 개수)
   - 실시간 분석 진행 상태 표시

### **API 연동 상태**
- ✅ 채널 정보 조회
- ✅ 채널 비디오 목록 조회
- ✅ 댓글 분석 실행
- ✅ 실시간 로딩 상태
- ✅ 에러 처리 및 알림
- ❌ 댓글 삭제 (OAuth 구현 필요)

### **실행 방법**
```bash
# 백엔드 실행
cd /home/cksgm/youtube
source venv/bin/activate
python main.py

# 프론트엔드 실행
cd /home/cksgm/youtube/frontend
npm run dev

# 접속
Frontend: http://localhost:5173
Backend: http://localhost:8000
```

### **현재 이슈**
1. **Antd 호환성 경고** - React 19 지원 관련 (기능적으로는 정상 작동)
2. **한국어 채널 URL** - URL 인코딩/디코딩 처리 완료
3. **댓글 삭제 기능** - OAuth 2.0 구현 필요

### **다음 구현 예정**
1. **SEO 라우터 연결 완료** - 백엔드 모듈 import 수정 (최우선)
2. **OAuth 2.0 인증** - Google/YouTube 계정 연동
3. **댓글 일괄 삭제** - 선택된 댓글 삭제 기능
4. **WebSocket 실시간 업데이트** - 분석 진행률 표시
5. **UI/UX 개선** - 반응형 디자인, 테마 적용
6. **데이터 내보내기** - 분석 결과 CSV/JSON 출력

### **🔧 SEO 연결 마무리 작업**
- [ ] `src/api/seo_routes.py` import 경로 확인
- [ ] `src/models/seo_models.py` 의존성 확인  
- [ ] `src/services/seo_analyzer.py` 모듈 로딩 확인
- [ ] 백엔드 재시작 후 `/api/v1/seo/health` 엔드포인트 테스트
- [ ] 임시 SEO 엔드포인트 제거 후 정식 라우터 연결

### **🏆 새로 추가된 SEO 분석 기능**
- **상위/하위 조회수 비교**: 상위 20% vs 하위 20% 비디오 분석
- **제목 최적화 분석**: 길이, 키워드, 특수문자 패턴
- **설명 최적화 분석**: 길이, 링크, 해시태그 사용
- **업로드 타이밍 분석**: 시간대, 요일별 패턴
- **개선 제안 시스템**: 우선순위별 SEO 개선 제안
- **한국어/영어 키워드 지원**: 다국어 키워드 패턴 분석

---

*이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다.*