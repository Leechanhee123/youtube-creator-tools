# YouTube Creator Tools - 프로젝트 이전 가이드

이 문서는 YouTube Creator Tools 프로젝트를 다른 데스크탑으로 이전하기 위한 완전한 가이드입니다.

## 📋 이전 전 체크리스트

### 1. 백업할 중요 파일들
```
youtube/
├── .env (환경 변수 - 중요!)
├── frontend/.env (프론트엔드 환경 변수 - 중요!)
├── src/ (전체 백엔드 소스코드)
├── frontend/src/ (전체 프론트엔드 소스코드)
├── requirements.txt (Python 의존성)
├── frontend/package.json (Node.js 의존성)
├── main.py (메인 애플리케이션)
├── PROJECT_PLAN.md (프로젝트 계획서)
└── CLAUDE.md (개발 가이드)
```

## 🔧 시스템 요구사항

### 필수 소프트웨어
- **Python 3.12+** (백엔드)
- **Node.js 18+** (프론트엔드)
- **npm** 또는 **yarn** (패키지 매니저)
- **Git** (버전 관리)

### 권장 도구
- **VSCode** (통합 개발 환경)
- **Postman** 또는 **Thunder Client** (API 테스트)

## 🚀 새 환경 설정 가이드

### 1단계: 프로젝트 클론/복사

#### Git 사용하는 경우:
```bash
git clone [repository-url] youtube-creator-tools
cd youtube-creator-tools
```

#### 파일 복사하는 경우:
- 전체 `youtube/` 폴더를 새 위치로 복사

### 2단계: Python 환경 설정

```bash
# Python 가상환경 생성
python -m venv venv

# 가상환경 활성화
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 3단계: Node.js 환경 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 또는 yarn 사용시:
# yarn install
```

### 4단계: 환경 변수 설정

#### 백엔드 환경 변수 (.env)
프로젝트 루트에 `.env` 파일 생성:

```env
PROJECT_NAME=YouTube Project
VERSION=1.0.0

# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
REDIS_URL=redis://localhost:6379

# YouTube Data API
YOUTUBE_API_KEY=your-youtube-api-key-here
YOUTUBE_API_SERVICE_NAME=youtube
YOUTUBE_API_VERSION=v3

# OAuth 2.0 (Google)
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/callback
OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Security (JWT)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=["http://localhost:3000", "http://localhost:8080", "http://localhost:5173"]
```

#### 프론트엔드 환경 변수 (frontend/.env)
`frontend/` 디렉토리에 `.env` 파일 생성:

```env
# 백엔드 API URL
VITE_API_BASE_URL=http://localhost:8000
```

### 5단계: 외부 서비스 설정

#### YouTube Data API 키 발급
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. YouTube Data API v3 활성화
4. API 키 생성
5. `.env` 파일의 `YOUTUBE_API_KEY`에 설정

#### Google OAuth 2.0 설정
1. Google Cloud Console > 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 생성
3. 리디렉션 URI 설정: `http://localhost:5173/auth/callback`
4. 클라이언트 ID와 시크릿을 `.env`에 설정

#### Supabase 데이터베이스
1. [Supabase](https://supabase.io/) 계정 생성
2. 새 프로젝트 생성
3. URL과 anon key를 `.env`에 설정

## 🏃‍♂️ 실행 방법

### 개발 서버 실행

#### 백엔드 서버 (포트: 8000)
```bash
# 프로젝트 루트에서
python main.py
```

#### 프론트엔드 서버 (포트: 5173)
```bash
# frontend 디렉토리에서
cd frontend
npm run dev
```

### 접속 URL
- **프론트엔드**: http://localhost:5173
- **백엔드 API**: http://localhost:8000
- **API 문서**: http://localhost:8000/docs

## 🔍 설정 검증

### 1. 백엔드 상태 확인
```bash
curl http://localhost:8000/health
```

### 2. YouTube API 연결 확인
```bash
curl "http://localhost:8000/api/v1/youtube-data/channel/info?channel_id=UC_test"
```

### 3. 프론트엔드 접속 확인
- 브라우저에서 http://localhost:5173 접속
- 로그인 페이지가 정상적으로 표시되는지 확인

## 📦 주요 의존성

### 백엔드 (Python)
```
fastapi==0.104.1              # 웹 프레임워크
uvicorn[standard]==0.24.0     # ASGI 서버
pydantic==2.11.7              # 데이터 검증
google-api-python-client==2.176.0  # YouTube API
supabase==2.16.0              # 데이터베이스
httpx==0.28.1                 # HTTP 클라이언트
python-multipart              # 폼 데이터 처리
python-dotenv                 # 환경 변수 로드
```

### 프론트엔드 (Node.js)
```
react==^19.1.0                # React 프레임워크
antd==^5.26.4                 # UI 컴포넌트 라이브러리
axios==^1.10.0                # HTTP 클라이언트
react-router-dom==^7.6.3      # 라우팅
@tanstack/react-query==^5.82.0  # 상태 관리
recharts==^3.1.0              # 차트 라이브러리
zustand==^5.0.6               # 상태 관리
typescript==~5.8.3            # TypeScript
vite==^7.0.3                  # 빌드 도구
```

## 🛠️ 개발 도구

### 유용한 명령어
```bash
# 백엔드 실행
python main.py

# 프론트엔드 개발 서버
cd frontend && npm run dev

# 프론트엔드 빌드
cd frontend && npm run build

# 타입 체크
cd frontend && npm run lint

# Python 의존성 업데이트
pip freeze > requirements.txt
```

### VSCode 확장 프로그램 권장사항
- Python
- TypeScript and JavaScript
- ES7+ React/Redux/React-Native snippets
- Thunder Client (API 테스트)
- GitLens

## ⚠️ 이전 시 주의사항

### node_modules와 venv 디렉토리
**중요**: 다음 디렉토리들은 이전하지 마세요 (심볼릭 링크 오류 발생):
```
❌ frontend/node_modules/     # 복사하지 마세요
❌ venv/                     # 복사하지 마세요
❌ __pycache__/              # 복사하지 마세요
```

**이유**: 이 디렉토리들에는 플랫폼별 바이너리와 심볼릭 링크가 포함되어 있어 다른 환경에서 작동하지 않습니다.

### 올바른 이전 방법
```bash
# 이전할 파일/폴더만 복사
youtube/
├── src/                    ✅ 복사
├── frontend/src/          ✅ 복사
├── frontend/public/       ✅ 복사
├── .env.example           ✅ 복사
├── frontend/.env.example  ✅ 복사
├── requirements.txt       ✅ 복사
├── frontend/package.json  ✅ 복사
├── main.py               ✅ 복사
├── PROJECT_PLAN.md       ✅ 복사
├── CLAUDE.md             ✅ 복사
└── MIGRATION_GUIDE.md    ✅ 복사

# 자동 재생성될 디렉토리들
├── frontend/node_modules/ ❌ 복사 안함 (npm install로 재생성)
├── venv/                 ❌ 복사 안함 (python -m venv로 재생성)
└── __pycache__/          ❌ 복사 안함 (자동 재생성)
```

## 🚨 주의사항

### 환경 변수 보안
- `.env` 파일은 **절대 Git에 커밋하지 마세요**
- 실제 API 키와 시크릿은 안전하게 보관하세요
- 프로덕션 환경에서는 더 강력한 `SECRET_KEY` 사용

### 포트 충돌
- 8000번 포트(백엔드)가 사용 중인 경우: `main.py`에서 포트 변경
- 5173번 포트(프론트엔드)가 사용 중인 경우: Vite가 자동으로 다른 포트 할당

### 방화벽 설정
- 로컬 개발시 8000, 5173 포트 허용 필요
- OAuth 리디렉션을 위해 도메인 설정 확인

## 🔧 문제 해결

### 일반적인 오류

#### "YouTube API quota exceeded"
- API 키 사용량 확인
- Google Cloud Console에서 할당량 증가 요청

#### "CORS policy error"
- 백엔드 `.env`의 `CORS_ORIGINS` 설정 확인
- 프론트엔드 URL이 CORS 허용 목록에 있는지 확인

#### "지정된 경로를 찾을 수 없습니다" 오류 (Windows)
**증상**: `frontend\node_modules\.bin\vite - 지정된 경로를 찾을 수 없습니다.(3)`

**원인**: 심볼릭 링크가 깨짐 (복사/압축 시 발생)

**해결방법**:
```bash
# 1. 기존 node_modules 완전 삭제
cd frontend
rm -rf node_modules package-lock.json

# 2. 캐시 정리 후 재설치
npm cache clean --force
npm install

# 3. Python 가상환경도 재생성
cd ..
rm -rf venv
python -m venv venv
```

#### "Module not found" 오류
- `pip install -r requirements.txt` 재실행
- `npm install` 재실행

#### 서버 실행 안됨
- 가상환경 활성화 확인
- 포트 사용 여부 확인 (`netstat -an | grep :8000`)

### 로그 확인
- 백엔드: 터미널 출력 확인
- 프론트엔드: 브라우저 개발자 도구 (F12) 확인

## 📞 지원

### 문제 발생시
1. 에러 메시지 전체 복사
2. 실행 환경 정보 (OS, Python/Node.js 버전)
3. 어떤 단계에서 문제가 발생했는지 명시

### 프로젝트 구조 참고
자세한 아키텍처와 개발 가이드는 `CLAUDE.md` 파일을 참조하세요.

---

**이전 완료 후 확인사항:**
- [ ] 백엔드 서버 정상 실행 (http://localhost:8000)
- [ ] 프론트엔드 서버 정상 실행 (http://localhost:5173)
- [ ] API 문서 접근 가능 (http://localhost:8000/docs)
- [ ] YouTube API 연결 테스트 완료
- [ ] OAuth 로그인 기능 테스트 완료
- [ ] 데이터베이스 연결 확인

이 가이드를 따라하시면 새로운 환경에서 프로젝트를 성공적으로 실행할 수 있습니다!