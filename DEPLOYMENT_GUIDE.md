# 🚀 YouTube Creator Tools 배포 가이드

## 1. Vercel 프론트엔드 배포 (무료)

### Step 1: GitHub 리포지토리 연결
1. 프로젝트를 GitHub에 푸시:
```bash
cd /home/cksgm/youtube
git init
git add .
git commit -m "Initial commit: YouTube Creator Tools"
git branch -M main
git remote add origin https://github.com/yourusername/youtube-creator-tools.git
git push -u origin main
```

### Step 2: Vercel 배포
1. https://vercel.com 접속 → GitHub 연결
2. "Import Project" → GitHub 리포지토리 선택
3. **Root Directory**: `frontend` 설정 ⚠️ 중요!
4. **Framework Preset**: Vite 자동 인식
5. **Environment Variables** 설정:
```bash
VITE_API_BASE_URL=https://your-backend-domain.railway.app
```

### Step 3: 도메인 확인
- 배포 완료 후 도메인: `https://your-app-name.vercel.app`
- 커스텀 도메인 연결 가능

## 2. Railway 백엔드 배포 (무료 티어)

### Step 1: Railway 프로젝트 생성
1. https://railway.app 접속 → GitHub 연결
2. "New Project" → "Deploy from GitHub repo"
3. 리포지토리 선택

### Step 2: 환경 변수 설정
Railway 대시보드에서 Variables 탭에 추가:
```bash
# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key

# Google OAuth 2.0  
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
OAUTH_REDIRECT_URI=https://your-app-name.vercel.app/auth/callback

# Supabase (선택사항)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_key

# Security
SECRET_KEY=your_production_secret_key_here

# CORS (프론트엔드 도메인)
CORS_ORIGINS=["https://your-app-name.vercel.app"]
```

### Step 3: Railway 설정 파일
```bash
# railway.json (루트 디렉토리)
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python main.py",
    "healthcheckPath": "/health"
  }
}
```

## 3. Google OAuth 2.0 프로덕션 설정

### Step 1: Google Cloud Console 업데이트
1. OAuth 2.0 클라이언트 ID 설정 수정:

**승인된 JavaScript 원본:**
```
https://your-app-name.vercel.app
```

**승인된 리디렉션 URI:**
```
https://your-app-name.vercel.app/auth/callback
```

### Step 2: OAuth 동의 화면 업데이트
```
홈페이지: https://your-app-name.vercel.app
개인정보처리방침: https://your-app-name.vercel.app/privacy
서비스 약관: https://your-app-name.vercel.app/terms
```

## 4. 배포 후 확인사항

### ✅ 체크리스트
- [ ] 프론트엔드 빌드 성공
- [ ] 백엔드 API 서버 실행 확인 (`/health` 엔드포인트)
- [ ] CORS 설정 올바른지 확인
- [ ] Google OAuth 리다이렉션 정상 작동
- [ ] 환경 변수 모두 설정됨
- [ ] YouTube API 호출 정상 작동

### 🔧 트러블슈팅

**1. CORS 에러**
```python
# main.py - CORS 설정 업데이트
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-app-name.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**2. OAuth 리다이렉션 실패**
- Google Cloud Console의 리다이렉션 URI 재확인
- HTTPS 프로토콜 사용 확인

**3. API 연결 실패**
- 백엔드 도메인 정확한지 확인
- Railway 배포 로그 확인

## 5. 권장 도메인 구성

### 무료 옵션:
- **프론트엔드**: `your-app.vercel.app`
- **백엔드**: `your-api.railway.app`

### 커스텀 도메인 (권장):
- **프론트엔드**: `youtubecreatortools.com`
- **백엔드**: `api.youtubecreatortools.com`

## 6. 모니터링 & 운영

### Vercel Analytics
- 사용자 방문 통계 확인
- 성능 모니터링

### Railway 모니터링  
- CPU/메모리 사용량 확인
- 로그 모니터링
- 업타임 확인

## 7. 비용 최적화

### 무료 티어 한계:
- **Vercel**: 100GB 대역폭/월
- **Railway**: 500시간 실행시간/월, 1GB RAM

### 업그레이드 고려시점:
- 월 방문자 10만명 이상
- API 호출량 급증
- 데이터베이스 필요시

이 가이드대로 배포하면 실제 도메인에서 YouTube Creator Tools가 정상 작동합니다! 🎉