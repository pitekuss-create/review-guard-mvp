# ReviewGuard 시스템 역설계 및 기술 명세 (Deep Dive Report)

본 문서는 ReviewGuard 프로젝트의 전체 코드베이스를 심층 분석하여 작성된 역설계(Reverse Engineering) 기반의 기술 아키텍처 및 비즈니스 로직 명세서입니다. 단순 요약을 넘어 시스템의 본질적 작동 원리와 한계를 시니어 아키텍트 관점에서 정리했습니다.

---

## 1. 서비스 아키텍처 개요 (Overview)

### 1.1 서비스 본질 및 비즈니스 로직
ReviewGuard는 오프라인 매장(소상공인 및 프랜차이즈 본사)을 타겟으로 하는 **B2B SaaS 마케팅 자동화 및 리뷰 관제 플랫폼**입니다.
핵심 비즈니스 로직은 다음과 같습니다:
1. **리뷰 수집 및 자동화**: 테이블 내 QR 스캔을 통해 오프라인 방문 고객을 유도하고, AI 기반 생성 프롬프트로 극찬에 가까운 네이버 플레이스 리뷰 텍스트를 자동 합성하여 제공합니다.
2. **리스크 방어 (비밀 소리함)**: 1점 테러나 악성 컴플레인이 예상될 경우, 이를 외부 노출(네이버) 대신 자체 시스템으로 우회시켜 부정 리뷰를 차단합니다.
3. **상권 검색 최적화(SEO)**: 경쟁사 및 지역 상권의 트래픽을 네이버 검색 광고 API와 AI로 분석하여 가장 전환율이 높은 키워드를 추출하고, 이를 리뷰 생성 시 자연스럽게 심어 플레이스 순위를 끌어올립니다.
4. **B2B 다중 테넌트 지원(HQ 관제)**: 프랜차이즈 본사(HQ)가 산하 가맹점 전체의 리뷰 지표, 위기 알림(Crisis Alert), 계약 만료 등을 한눈에 모니터링할 수 있는 대시보드를 제공합니다.

### 1.2 핵심 기술 스택 명세
- **Frontend / Framework**: Next.js 16.2.3 (App Router 방식), React 19.2.4
- **UI / Styling**: TailwindCSS v4, 글로벌 CSS (`app/globals.css`), Lucide React (아이콘)
- **Backend (API)**: Next.js Route Handlers (`app/api/*`)를 활용한 서버리스 구조
- **Database / Authentication**: Supabase (PostgreSQL), `@supabase/ssr` 0.10.2, `@supabase/supabase-js` 2.102.1
- **Global State Management**: Zustand 5.0.12 (보안 강화를 위한 부분적 로컬 스토리지 영속화 적용)
- **AI / LLM**: OpenAI API 6.34.0 (`gpt-4o-mini` 모델 주력)
- **결제 연동 (Payment)**: Toss Payments Widget SDK 0.12.1
- **데이터 시각화**: Recharts 3.8.1 (Scatter Chart 기반 가맹점 포트폴리오 매트릭스 등)
- **크롤링 및 텍스트 분석**: Cheerio 1.2.0, Kuromoji-ko 1.0.8

---

## 2. 사용자 플로우 및 권한 (User Roles & Flows)

Supabase RLS(Row Level Security) 및 `auth.users` 기반의 강력한 권한 분리 시스템을 채택하고 있으며, 미들웨어(`middleware.ts`)에서 인증 및 인가를 1차적으로 통제합니다.

### 2.1 유저 권한 분류 (`user_roles` Type)
| 권한 레벨 | 설명 및 특이사항 |
| :--- | :--- |
| **`STORE_OWNER`** | 단일 또는 다중 매장을 운영하는 개별 점주. 자신이 소유한 매장(`stores.owner_id = auth.uid()`)의 데이터만 열람 가능합니다. |
| **`HQ_ADMIN`** | 프랜차이즈 본사 관리자. `organizations` 테이블에 속하며, 해당 조직에 속한 수십/수백 개의 가맹점 데이터를 한 번에 통합 모니터링합니다. |
| **`SUPER_ADMIN`** | 플랫폼 관리자. 모든 조직과 매장, 결제 데이터에 접근 가능한 최상위 권한입니다. |

### 2.2 핵심 Routing 및 사용자 플로우
- **온보딩 및 라우팅 제어 (`middleware.ts`)**: 신규 가입 유저나 트라이얼 만료 유저는 일반 대시보드 진입이 차단되고 강제로 `/onboarding` 또는 `/pricing` 으로 리다이렉트됩니다.
- **점주 플로우 (`/dashboard`, `/settings`)**: 
  - 점주는 대시보드에서 매장 리뷰 유입량, 키워드 효율을 확인합니다.
  - 타임머신 유틸리티(`TimeMachineController`)를 통해 강제로 만료 상태를 시뮬레이션 하거나 결제 시스템을 테스트할 수 있습니다.
- **HQ 플로우 (`/hq/dashboard`)**: 
  - `HQOverview.tsx`를 통해 실시간 가맹점 매트릭스(리뷰 수 vs 평점 기반 Scatter Chart) 조회가 가능합니다.
  - 가맹점에 위기(Crisis) 발생 시 카카오톡 독려 메시지를 복사하거나, 가맹점 연동 코드를 즉시 발급하여 신규 매장을 연결합니다.

---

## 3. 핵심 기능 명세서 (Core Features Description)

### 3.1 AI 영수증 리뷰 생성 엔진 (`/api/generate-review/route.ts`)
- **작동 방식**: 점주가 등록한 매장 컨셉과 고객이 선택한 키워드를 프롬프트에 조합해 OpenAI `gpt-4o-mini` 모델에 전달합니다.
- **로직 특징 (프롬프트 엔지니어링)**:
  - "절대 AI가 쓴 티가 나지 않는 구어체", "단점을 짓지 마라", "줄바꿈을 2번씩 적용해 시각적 여백 강제" 등의 강력한 시스템 프롬프트를 주입하여 퀄리티를 통제합니다.
  - **Billing Lock (과금 방어벽)**: DB에서 `trial_start_date`를 체크해 14일 초과 시 403 에러를 뱉고 리뷰 생성을 원천 차단합니다.

### 3.2 경쟁사 타겟 키워드 분석 (`/api/competitor/analyze/route.ts`)
- **작동 방식**: 지역 상권, 매장명, 메뉴를 입력받아 상위 노출용 키워드를 추출합니다.
- **로직 특징**: 
  1. AI 모델이 외식업 전문 용어(객단가, CVR, TPO 등)를 활용해 상권 분석 리포트를 먼저 도출하고 후보 키워드 20개를 생성합니다.
  2. 추출된 후보를 **네이버 검색광고 API(`/keywordstool`)**로 던져 PC/Mobile 실제 검색량을 조회합니다.
  3. 트래픽 순으로 정렬 후 상위 7개만 걸러내는 교차 검증 시스템(OpenAI + Naver API)을 구축했습니다. (네이버 API 통신 장애 시 AI 단독 폴백 모드 지원)

### 3.3 HQ 통합 모니터링 시스템 및 초대 (`/app/dashboard/HQOverview.tsx`)
- **작동 방식**: 본사 관리자가 산하 가맹점을 관제합니다. 평점이 급락하거나 리뷰 수가 정체된 가맹점에는 "CRISIS" 혹은 "WARN" 상태가 부여됩니다.
- **로직 특징**: 
  - 1회용 동적 토큰 기반 초대 시스템: API 연동을 통해 6자리 코드 및 링크를 즉석 발급(`hq_invites` 테이블 저장)하여 점주가 이를 입력하면 본사 시스템에 소속되게 만듭니다.
  - 긴급 알림(Toast) 및 카카오톡 메시지 템플릿(클립보드 API 활용) 등 인터랙티브 UX가 결합되어 있습니다.

---

## 4. 데이터 및 상태 관리 구조 (Data Models)

### 4.1 글로벌 상태 관리 (Zustand: `lib/store/useStore.ts`)
- **보안 격리 구조 (Security-First State)**: Zustand 스토어는 브라우저 로컬 스토리지(`review-guard-storage`)에 현재 열람 중인 `currentStoreId`만 저장합니다. 
- **이유**: `userRole` (HQ_ADMIN 등)이나 권한 관련 정보를 클라이언트 로컬 저장소에 남길 경우 보안 취약점(Role 변조)이 발생하므로, 권한 정보는 메모리 상태에만 올려두고 초기화 시 DB 세션에서만 받아오도록 설계되었습니다.

### 4.2 Database 핵심 스키마 구조
1. **`stores`**: 전체 서비스의 핵심 엔티티. 매장명, 컨셉, 결제 정보(trial_start), `owner_id`, `organization_id`를 보유합니다. `is_hq_sponsored` 플래그는 본사에서 과금을 부담하여 점주의 구독 결제를 면제해주는 역할을 합니다.
2. **`user_roles`**: Supabase Auth 유저와 서비스 권한(`STORE_OWNER`, `HQ_ADMIN`)을 맵핑. 모든 접근 권한은 `get_my_role()` 함수를 거친 RLS 정책으로 제어됩니다.
3. **`hq_invites`**: HQ 어드민이 생성하는 1회성 가입/연동 토큰 저장.
4. **`monthly_reports` & `reviews_log`**: 리뷰 생성 로그 기록 및 매월 1일 가맹점 별 성과 스냅샷을 JSON 타입으로 직렬화해 보관하는 데이터 자산 저장소입니다.

---

## 5. 현재 구현 한계 및 미완성 영역 (Tech Debt & Missing Parts)

### 5.1 심각한 보안 취약점: 하드코딩된 Secret Keys
- **파일**: `app/api/generate-review/route.ts` (12-15라인 등)
- **이슈 내용**: MVP 빠른 테스트를 위해 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 서버사이드 코드 내부에 일반 문자열로 **평문 하드코딩**되어 있습니다. 이는 치명적 보안 결함이므로 `.env.local`로의 즉각적 분리 및 마이그레이션이 최우선 과제입니다.

### 5.2 권한 동기화 레이턴시 (Auth Session Lag)
- **파일**: `app/dashboard/page.tsx`
- **이슈 내용**: 유저가 토스 페이먼츠 결제 직후 플랜이 업그레이드될 때, 클라이언트의 JWT 세션 갱신 딜레이(지연) 문제가 존재합니다. 이를 우회하기 위해 `payment_success=true` 파라미터가 있을 때 강제로 최고 권한인 Admin Client(`SUPABASE_SERVICE_ROLE_KEY`)를 써서 유저 권한을 찔러보는 우회 로직이 심어져 있습니다. 구조적 개선이 필요합니다.

### 5.3 타입 불일치와 강제 형변환 (DB 성능 저하 리스크)
- **파일**: `supabase/migrations/20260421_b2b_multi_tenant_rls.sql` 등
- **이슈 내용**: 초기 테이블들이 `store_id`를 `TEXT`로 설계했다가 이후 UUID로 넘어오면서, RLS 조인 정책 단에서 `stores.id::text = review_keywords.store_id::text` 와 같이 대량의 강제 캐스팅(Casting)이 하드코딩되어 있습니다. 데이터가 방대해질 경우 심각한 쿼리 속도 저하를 유발합니다.

### 5.4 네이버 API 폴백 제어(Silent Failure) 모니터링 부재
- **파일**: `app/api/competitor/analyze/route.ts`
- **이슈 내용**: 키워드 트래픽 조회 시 네이버 광고 API 키가 없거나 호출이 실패하면, Error를 던지는 대신 조용히 `openai_only` (AI 단독 예측치) 전략으로 fallback 하도록 구현되어 있습니다. 장애 감지 모니터링이 없다면 운영자는 API 토큰 만료 사실을 눈치채기 어렵습니다.

### 5.5 더미 로직 및 미구현 UI
- **파일**: `app/dashboard/HQOverview.tsx` (파일 다운로드 등)
- **이슈 내용**: "가맹점별 개별 리포트 저장(ZIP 다운로드)" 버튼 클릭 시 실제 데이터를 압축하여 반환하는 백엔드 로직이 존재하지 않습니다. 단순히 10초 뒤에 다운로드 완료 Toast를 띄워주는 더미(Dummy) 타이머 로직(`setTimeout`)으로 껍데기만 구현되어 있습니다. 동적 파일 생성 로직 개발이 추가로 요구됩니다.
