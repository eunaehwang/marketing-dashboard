# 마케터 대시보드

마케터 업무 자동화를 위한 통합 대시보드입니다. 키워드 분석, 트렌드 분석, 후기 분석, 경쟁사 분석, 일정 관리, AI 기획봇 기능을 단계별로 구축합니다.

## 기술 스택

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **배포**: Vercel
- **데이터베이스**: Supabase (예정)
- **AI**: Claude API (예정)
- **외부 API**: 네이버 DataLab, 네이버 검색광고 API (예정)

## 개발 단계

- [x] 1단계: 기본 대시보드 UI
- [ ] 2단계: 네이버 DataLab API 트렌드 연동
- [ ] 3단계: 네이버 검색광고 API 키워드 검색량 연동
- [ ] 4단계: 후기 분석 기능
- [ ] 5단계: 경쟁사 분석 기능
- [ ] 6단계: AI 기획봇 (Claude API)

## 로컬 실행

```bash
npm install
npm run dev
```

http://localhost:3000 에서 확인하세요.

## 환경 변수

```env
# 네이버 개발자센터
NEXT_PUBLIC_NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=

# 네이버 검색광고
NAVER_AD_CUSTOMER_ID=
NAVER_AD_ACCESS_LICENSE=
NAVER_AD_SECRET_KEY=

# Claude API (Anthropic)
ANTHROPIC_API_KEY=

# OpenRouter (Perplexity sonar-pro 등)
OPENROUTER_API_KEY=

# Upstash Redis (서버 저장소 — 없으면 localStorage만 사용)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# 대시보드 접근 비밀번호 (설정 시 로그인 필요)
DASHBOARD_PASSWORD=

# Hermes Agent 연동 토큰 (설정 시 /api/hermes-context 인증 활성)
HERMES_TOKEN=
```
