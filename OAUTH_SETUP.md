# Google OAuth 2.0 설정 가이드

## 1. Google Cloud Console 설정

### Step 1: 프로젝트 생성
1. https://console.cloud.google.com/ 접속
2. 새 프로젝트 생성 (프로젝트 이름: YouTube Creator Tools)

### Step 2: API 활성화
1. 좌측 메뉴 → "API 및 서비스" → "라이브러리"
2. 다음 API들을 검색하고 "사용 설정":
   - YouTube Data API v3
   - Google+ API (사용자 정보용)

### Step 3: OAuth 동의 화면 설정
1. 좌측 메뉴 → "API 및 서비스" → "OAuth 동의 화면"
2. 사용자 유형: **"외부"** 선택
3. 앱 정보 입력:
   ```
   앱 이름: YouTube Creator Tools
   사용자 지원 이메일: your-email@gmail.com
   앱 로고: (선택사항)
   앱 도메인:
     - 홈페이지: http://localhost:5173 (개발용)
   개발자 연락처 정보: your-email@gmail.com
   ```

4. 범위(Scopes) 추가:
   ```
   - ../auth/youtube.readonly
   - ../auth/youtube.force-ssl  
   - ../auth/userinfo.email
   - ../auth/userinfo.profile
   ```

5. 테스트 사용자 추가 (개발 중):
   - 본인 Gmail 계정 추가

### Step 4: OAuth 2.0 클라이언트 ID 생성
1. 좌측 메뉴 → "API 및 서비스" → "사용자 인증 정보"
2. "+ 사용자 인증 정보 만들기" → "OAuth 클라이언트 ID"
3. 설정:
   ```
   애플리케이션 유형: 웹 애플리케이션
   이름: YouTube Creator Tools Web Client
   
   승인된 JavaScript 원본:
   - http://localhost:5173
   - http://localhost:3000
   
   승인된 리디렉션 URI:
   - http://localhost:5173/auth/callback
   ```

4. 생성 완료 후 **클라이언트 ID**와 **클라이언트 보안 비밀**을 복사

## 2. 환경 변수 설정

### 백엔드 (.env)
```bash
# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Google OAuth 2.0
GOOGLE_CLIENT_ID=123456789012-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
OAUTH_REDIRECT_URI=http://localhost:5173/auth/callback

# Supabase (선택사항)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

### 프론트엔드 (.env)
```bash
VITE_API_BASE_URL=http://localhost:8000
```

## 3. 개발 서버 실행

### 백엔드 실행
```bash
cd /home/cksgm/youtube
python main.py
```

### 프론트엔드 실행
```bash
cd /home/cksgm/youtube/frontend
npm run dev
```

## 4. 테스트 방법

1. http://localhost:5173 접속
2. 우측 상단 "YouTube 로그인" 버튼 클릭
3. Google OAuth 동의 화면에서 권한 승인
4. 로그인 성공 후 대시보드로 리다이렉트

## 5. 에러 해결

### 400 오류: invalid_request
- **원인**: 리다이렉션 URI가 Google Cloud Console에 등록되지 않음
- **해결**: OAuth 클라이언트 설정에서 정확한 URI 추가

### 403 오류: access_denied  
- **원인**: OAuth 동의 화면이 "테스트" 모드이고 테스트 사용자에 등록되지 않음
- **해결**: 테스트 사용자에 본인 Gmail 계정 추가

### API 할당량 초과
- **원인**: YouTube Data API 일일 할당량 초과
- **해결**: Google Cloud Console에서 할당량 확인 및 증설 요청

## 6. 배포 시 추가 설정

### 프로덕션 OAuth 설정
```
승인된 JavaScript 원본:
- https://yourdomain.com

승인된 리디렉션 URI:
- https://yourdomain.com/auth/callback
```

### 환경 변수 업데이트
```bash
OAUTH_REDIRECT_URI=https://yourdomain.com/auth/callback
```

## 7. 보안 고려사항

1. **클라이언트 보안 비밀**: 절대 프론트엔드에 노출 금지
2. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS 사용
3. **도메인 검증**: 승인된 도메인에서만 OAuth 요청 허용
4. **토큰 저장**: 안전한 방식으로 토큰 저장 및 관리

이 가이드를 따라 설정하면 YouTube Creator Tools의 OAuth 2.0 인증이 정상 작동합니다.