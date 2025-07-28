# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요
YouTube Creator Tools - 매크로 댓글 관리 및 채널 분석 도구입니다. FastAPI 백엔드와 React 프론트엔드로 구성되어 있으며, YouTube Data API와 댓글 분석 시스템을 통합했습니다.

## 개발 환경 설정

### 백엔드 (Python/FastAPI)
```bash
# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
# 또는
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 프론트엔드 (React/TypeScript)
```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 실행
npm run lint
```

### 테스트 실행
```bash
# Python 테스트
python -m pytest

# 개별 테스트 파일 실행
python -m pytest tests/test_youtube_downloader.py

# 특정 테스트 함수 실행
python -m pytest tests/test_youtube_downloader.py::test_specific_function
```

## 아키텍처 구조

### 백엔드 구조
- **main.py**: FastAPI 앱 진입점, CORS 설정, WebSocket 지원
- **src/api/**: API 라우터 모음 (auth, youtube, seo, processor 등)
- **src/core/**: 설정 관리 (config.py, database.py)
- **src/models/**: Pydantic 데이터 모델
- **src/services/**: 비즈니스 로직 (YouTube API, 댓글 분석, SEO 분석 등)

### 프론트엔드 구조  
- **React 18 + TypeScript + Vite** 기반
- **Ant Design** UI 라이브러리 사용
- **Context API**: 테마, 언어, 인증 상태 관리
- **React Query**: API 상태 관리
- **다국어 지원**: 한국어, 영어, 일본어

### 핵심 기능 플로우
1. **OAuth 2.0 인증**: Google 계정으로 YouTube 채널 연동
2. **댓글 분석**: YouTube Comment Downloader + AI 기반 매크로/스팸 탐지
3. **SEO 분석**: 상위/하위 성과 비디오 비교 분석
4. **경쟁사 분석**: 유사 채널 성과 모니터링

## API 엔드포인트

### 주요 API 패턴
- **인증**: `/auth/youtube/*` - OAuth 2.0 플로우
- **YouTube 데이터**: `/api/v1/youtube-data/*` - 채널/비디오 정보
- **댓글 분석**: `/api/v1/processor/*` - 매크로 댓글 탐지
- **SEO 분석**: `/api/v1/seo/*` - 채널 최적화 분석
- **실시간 통신**: `WebSocket /ws` - 분석 진행 상황

### 환경 변수 설정
```bash
# 백엔드 (.env)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
YOUTUBE_API_KEY=your_youtube_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key

# 프론트엔드 (.env)
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## 개발 가이드라인

### 코드 컨벤션
- **백엔드**: Python PEP 8, type hints 사용
- **프론트엔드**: TypeScript strict mode, functional components
- **API 응답**: 표준 JSON 형태 (`{success, message, data}`)

### 성능 최적화
- **대용량 댓글 처리**: 스트리밍 방식 구현
- **React 최적화**: useMemo, useCallback 적절히 활용  
- **API 캐싱**: React Query로 서버 상태 관리

### 보안 고려사항
- **OAuth 토큰**: secure 저장, 자동 갱신
- **API 키**: 환경 변수로 관리, 노출 방지
- **CORS**: 프로덕션 도메인만 허용

## 문제 해결

### 일반적인 이슈
1. **YouTube API 할당량 초과**: API 키 교체 또는 요청 최적화
2. **OAuth 인증 실패**: 리다이렉트 URI, 클라이언트 ID 확인
3. **댓글 다운로드 실패**: 비디오 설정(댓글 비활성화) 확인
4. **프론트엔드 빌드 오류**: Node.js 버전, 의존성 호환성 확인

### 디버깅 도구
- **백엔드**: `/health`, `/api/v1/status` 엔드포인트
- **프론트엔드**: 브라우저 개발자 도구, React DevTools
- **API 테스트**: `/docs` (FastAPI 자동 문서)

## 배포 환경

### 프로덕션 설정
- **백엔드**: Railway, Heroku 등 Python 호스팅
- **프론트엔드**: Vercel, Netlify 정적 배포
- **환경 변수**: 각 플랫폼의 환경 설정에서 관리
- **CORS**: 프로덕션 도메인으로 제한