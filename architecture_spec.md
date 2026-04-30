# ReviewGuard 시스템 딥 다이브 분석 보고서

본 문서는 ReviewGuard 프로젝트의 전체 코드베이스를 역설계하여 작성된 기술 명세서 수준의 시스템 아키텍처 및 비즈니스 로직 분석 리포트입니다.

## 1. 서비스 아키텍처 개요 (Overview)

### 1.1 핵심 비즈니스 로직 요약
ReviewGuard는 오프라인 매장(소상공인 및 프랜차이즈)의 네이버 플레이스 리뷰 및 검색 키워드 최적화를 돕는 **B2B SaaS 플랫폼**입니다.
QR 코드를 통한 오프라인 고객의 리뷰 작성을 유도하고(AI 기반 자동 리뷰 생성), 경쟁사 상권 및 검색 트래픽 데이터를 분석해 SEO 최적화 리포트를 제공하며, 이를 프랜차이즈 본사(HQ)와 개별 매장 단위로 관리할 수 있는 다중 테넌트(Multi-tenant) 구조를 가집니다.

### 1.2 핵심 기술 스택 명세
- **Frontend / Framework**: Next.js 16.2.3 (App Router), React 19.2.4
- **Styling**: TailwindCSS v4, 글로벌 CSS(`globals.css`)
- **Backend (API)**: Next.js Route Handlers (`app/api/*`)
- **Database / Auth**: Supabase (PostgreSQL, `@supabase/ssr: 0.10.2`, `@supabase/supabase-js: 2.102.1`)
- **Global State**: Zustand 5.0.12 (Persist middleware 적용)
- **AI / LLM API**: OpenAI API (`openai: 6.34.0`, 모델: `gpt-4o-mini`)
- **External APIs**: Toss Payments SDK (`@tosspayments/payment-widget-sdk: 0.12.1`), Naver Search Ad API (키워드 검색량 데이터)
- **Data Visualization**: Recharts 3.8.1
- **Utilities**: Cheerio 1.2.0 (크롤링 보조), Kuromoji-ko 1.0.8 (형태소 분석기), qrcode.react 4.2.0

---

## 2. 사용자 플로우 및 권한 (User Roles & Flows)

시스템은 `user_roles` 테이블과 Supabase RLS 정책을 통해 철저하게 분리된 3단계 권한 구조를 가집니다.

### 2.1 유저 권한 분류
| 권한 (Role) | 설명 |
| :--- | :--- |
| `STORE_OWNER` | 개별 매장의 점주. 자신의 매장에 대한 리뷰 생성 및 분석 데이터만 조회 가능. |
| `HQ_ADMIN` | 프랜차이즈 본사 관리자. 소속 조직(`organizations`) 산하의 모든 매장 목록 조회, 스냅샷 확인 및 통합 관리 수행. |
| `SUPER_ADMIN` | 플랫폼 총괄 관리자. 모든 조직, 유저, 결제, 시스템 데이터를 열람하고 제어할 수 있는 슈퍼 계정. |

### 2.2 권한별 주요 화면(Routing) 및 핵심 액션
- **공통 플로우**
  - `/login`, `/onboarding`: 가입 및 매장 초기 정보 입력 라우트. 인증되지 않은 사용자는 접근 불가(Middleware/Guard).
- **STORE_OWNER 플로우**
  - `/dashboard`: 자신의 매장별 통계, 스냅샷, 타임머신(TimeMachineController), 리뷰 현황 조회.
  - `/settings`, `/pricing`: 결제 및 매장 정보 수정, 구독 관리(Toss Payments 연동).
  - *핵심 액션*: 단일 매장의 컨셉, 키워드 등록 및 생성된 AI 영수증 리뷰 복사 현황 파악.
- **HQ_ADMIN 플로우**
  - `/hq/dashboard`: 본사 관점의 가맹점 통합 대시보드.
  - *핵심 액션*: `dashboard` 진입 시 `isFromHqSelection` 파라미터가 없으면 강제로 `/hq/dashboard`로 리다이렉트되어 조직 레벨의 관리 화면으로 유도. 특정 매장을 선택하여 `/dashboard?storeId=xxx` 로 접근해 해당 매장의 데이터를 상세 열람.

---

## 3. 핵심 기능 명세서 (Core Features Description)

### 3.1 경쟁사 타겟 키워드 분석 (Competitor Keyword Analyzer)
- **엔드포인트**: `POST /api/competitor/analyze`
- **로직**:
  1. 점주가 입력한 상권/지역명, 매장명, 대표 메뉴를 기반으로 OpenAI `gpt-4o-mini` 모델을 호출해 네이버 검색 기반 예상 타겟 키워드 후보 20개와 전문적인 분석 리포트(상권 전략, 메뉴 경쟁력)를 생성.
  2. 추출된 키워드 후보들을 **네이버 광고 API(`/keywordstool`)**에 던져 실제 월간 PC/Mobile 검색량을 조회.
  3. 실제 검색량(Volume)이 높은 순으로 정렬하여 상위 7개를 최종 타겟 키워드로 반환.
  4. 네이버 API 호출 실패 시, AI가 생성한 키워드만 반환하는 폴백(Fallback) 모드(`openai_only`) 작동.

### 3.2 AI 영수증 리뷰 생성 (Review Generator)
- **엔드포인트**: `POST /api/generate-review`
- **로직**:
  1. 프론트엔드에서 전달받은 `storeId`로 해당 매장의 컨셉(concept)과 트라이얼 시작일 조회.
  2. **과금 락(Billing Lock)**: `trialStartDate` 기준 14일 초과 시, 결제 플랜 업그레이드를 요구하며 생성 차단 (403 Error).
  3. 고객이 선택한 키워드와 별점을 바탕으로 OpenAI API에 '구어체, 극찬 기반, 줄바꿈이 많은 모바일 친화적' 시스템 프롬프트를 주입하여 리뷰 텍스트 합성.
  4. 생성된 리뷰 데이터는 `reviews_log` 테이블에 적재. (향후 고객이 리뷰를 복사했는지 `is_copied` 트래킹)

### 3.3 고객 전환 퍼널 트래킹 (Funnel Tracking)
- **엔드포인트 및 스키마**: `/api/increment-qr-scan` 및 `conversion_log` 테이블
- **로직**:
  - `conversion_step` enum: `scanned` -> `keyword_selected` -> `copied` -> `redirected`
  - 오프라인 매장의 QR 코드를 고객이 스캔하고 AI 리뷰를 복사하여 네이버 플레이스로 넘어가기까지의 일련의 과정을 로깅. 이를 통해 대시보드의 `RoiModal` 등에서 리뷰 전환율(CVR) 데이터 제공.

### 3.4 하이브리드 결제 및 HQ 초대 시스템
- **데이터 로직**: `supabase/migrations/20260422_enterprise_logic_overhaul.sql`
- **로직**:
  - `hq_invites` 테이블을 통한 1회용 동적 토큰 기반 초대 시스템. 토큰을 타고 들어오면 `HQ_ADMIN` 권한 부여 및 특정 `organization` 맵핑.
  - `stores.is_hq_sponsored` 플래그: 프랜차이즈 본사에서 비용을 부담하는 매장의 경우, 해당 플래그를 `TRUE`로 설정하여 개별 점주의 결제 및 트라이얼 만료 로직에서 면제 처리(B2B Billed).

---

## 4. 데이터 및 상태 관리 구조 (Data Models)

### 4.1 글로벌 상태 관리 (Zustand: `lib/store/useStore.ts`)
- **보안 중심 설계**: 브라우저 로컬 스토리지(`review-guard-storage`)에는 오직 `currentStoreId`(현재 조회 중인 매장 ID)만 `partialize`로 저장함.
- **이유**: `userRole`(`STORE_OWNER`, `HQ_ADMIN` 등) 정보를 로컬에 저장하면 클라이언트 단에서 임의로 Role을 변조하는 보안 취약점이 발생할 수 있으므로 권한 정보는 상태에만 임시 캐싱하고 영속화(Persist)하지 않음.

### 4.2 데이터베이스 핵심 스키마 (Supabase PostgreSQL)
1. **`auth.users` & `user_roles`**: 사용자 계정과 서비스 권한(`STORE_OWNER`, `HQ_ADMIN`, `SUPER_ADMIN`), 그리고 소속된 `organization_id`를 1:1 매핑. 모든 권한 체크는 `get_my_role()` RLS 함수를 통해 DB 단에서 통제.
2. **`stores`**: 핵심 엔티티. 매장 정보, `owner_id`, `organization_id`, `is_hq_sponsored` 컬럼을 포함하며 점주 또는 HQ가 접근 가능.
3. **`organizations`**: 프랜차이즈 본사 등 B2B 고객사 정보 저장.
4. **시계열 데이터 (데이터 자산화)**:
   - `competitor_snapshot`: 특정 시점의 경쟁사 키워드 데이터 저장 (`store_id`, `keywords` JSON).
   - `monthly_reports`: 매월 1일 기준 해당 매장의 성과(평균 별점, 리뷰 수) 스냅샷 데이터를 JSON 형태로 저장하여 리포팅 지원.
   - `reviews_log`: 사용자가 생성한 AI 리뷰들의 이력.

---

## 5. 현재 구현 한계 및 미완성 영역 (Tech Debt & Missing Parts)

### 5.1 하드코딩된 시크릿 키 (Critical Security Issue)
- **파일**: `app/api/generate-review/route.ts` (12-15라인, 117-119라인)
- **이슈**: MVP 테스트 용도로 Supabase URL과 `anon_key`가 서버 사이드 파일 내부에 **평문(Plaintext)으로 하드코딩**되어 있습니다. 이는 보안상 매우 취약하며 즉시 `process.env.NEXT_PUBLIC_SUPABASE_URL` 등의 환경 변수로 분리(Dynamic 수정)해야 합니다.

### 5.2 권한 동기화 레이턴시 보정 로직
- **파일**: `app/dashboard/page.tsx`
- **이슈**: 결제 직후(Toss 매장 연동 후 리다이렉트) Supabase Auth 세션 갱신 딜레이를 우회하기 위해 `payment_success=true`인 경우, 서비스 클라이언트 대신 `createAdminClient()` (service_role)를 사용하여 강제로 최신 권한을 조회하는 '수술' 로직이 삽입되어 있습니다. 완벽하지 않은 상태 동기화 처리의 기술 부채입니다.

### 5.3 타입 불일치 해결을 위한 억지 형변환
- **파일**: `20260421_b2b_multi_tenant_rls.sql`
- **이슈**: 기존 시스템에 존재하던 `store_id` 또는 `user_id`가 일부 텍스트(`TEXT`) 타입으로 설계되어, 신규 추가된 `UUID` 테이블(`reviews_log`, `review_keywords` 등)과의 조인을 위해 RLS 정책 단에서 `stores.id::text = review_keywords.store_id::text` 처럼 강제 캐스팅이 하드코딩되어 있습니다. DB 성능 저하의 원인이 될 수 있습니다.

### 5.4 네이버 API 키 누락 시 폴백 제어 (Silencing Error)
- **파일**: `app/api/competitor/analyze/route.ts`
- **이슈**: `fetchNaverSearchVolumes` 함수에서 `clientId` 등이 없으면 예외(Error)를 던지지 않고 조용히 빈 Map을 반환하여 `openai_only` 전략으로 빠지게 설계되어 있습니다. 모니터링 시스템 연동이 안 되어 있다면 네이버 API 만료/에러 시에도 관리자가 즉시 알아채기 힘든 한계가 있습니다.

### 5.5 더미 로직 및 임시 삽입 코드
- **`SUPER_ADMIN` 설정 방식**: MVP 단계라 관리자 화면(Admin UI)이 완비되지 않아, 특정 이메일(`대표님@이메일.com`)을 DB 마이그레이션 스크립트 단에서 수동 쿼리로 권한 격상시키는 하드코딩 방식이 주석 처리되어 있습니다.
