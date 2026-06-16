import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase 환경변수가 누락되었습니다. Vercel 세팅을 확인하세요.");
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with cross-browser cookies across different domains.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAccessingHQ = request.nextUrl.pathname.startsWith("/hq");
  const isAccessingDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isAccessingOnboarding = request.nextUrl.pathname.startsWith("/onboarding");
  const isAccessingPricing = request.nextUrl.pathname.startsWith("/pricing");

  if (
    !user &&
    (isAccessingDashboard || isAccessingOnboarding || isAccessingHQ)
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  // Allow passing if user is accessing login but is already logged in
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = request.nextUrl.search;
    return NextResponse.redirect(url);
  }

  if (user) {
    // 1. 유저 권한(Role) 선제 검사
    let roleData = null;
    try {
      const timeoutPromise = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000)
      );

      const result = await Promise.race([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
        timeoutPromise
      ]);
      roleData = result?.data;
    } catch (e) {
      if (isAccessingHQ) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
      }
    }

    const userRole = roleData?.role || "";

    // 🚀 [SUPER_ADMIN 리다이렉트 분기] 최고 관리자는 무조건 /super-admin으로 가도록 교정
    if (userRole === "SUPER_ADMIN") {
      const isAccessingSuperAdmin = request.nextUrl.pathname.startsWith("/super-admin");
      const isPageRequest = 
        !request.nextUrl.pathname.startsWith("/api") && 
        !request.nextUrl.pathname.startsWith("/_next") &&
        !request.nextUrl.pathname.includes("."); // 정적 파일 및 애셋 제외

      if (isPageRequest && !isAccessingSuperAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/super-admin";
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const isHQUser = roleData && (roleData.role === "HQ_ADMIN" || roleData.role === "hq");

    if (isHQUser) {
      // 2. HQ 권한 유저 로직
      if (isAccessingDashboard || isAccessingOnboarding || isAccessingPricing) {
        const storeId = request.nextUrl.searchParams.get("storeId");
        
        if (isAccessingDashboard && storeId) {
          // 상세 가맹점 대시보드 접근 시, 해당 매장의 요금제나 본사 소속 여부 확인
          try {
            const { data: store } = await supabase
              .from("stores")
              .select("id, is_hq_sponsored, subscription_tier, organization_id")
              .eq("id", storeId)
              .maybeSingle();

            if (store) {
              const isHqStore = (roleData?.organization_id && store.organization_id === roleData.organization_id);
              
              if (isHqStore) {
                console.log(`[Middleware] HQ_ADMIN Free Pass -> currentStoreId: ${store.id}, tier: HQ_SPONSORED (original: ${store.subscription_tier})`);
              } else {
                console.log(`[Middleware] HQ_ADMIN Personal Store -> currentStoreId: ${store.id}, tier: ${store.subscription_tier}`);
              }
            }
          } catch (e) {
            // 무시
          }
          return supabaseResponse;
        }

        const url = request.nextUrl.clone();
        url.pathname = "/hq";
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
      }
      
      if (isAccessingHQ) {
        return supabaseResponse;
      }
    } else {
      // 3. 일반 사장님 로직
      // HQ 접근 시 대시보드로 튕겨냄
      if (isAccessingHQ) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        url.search = request.nextUrl.search;
        return NextResponse.redirect(url);
      }

      // 온보딩, 대시보드, 요금제 접근 시 매장 유무 검사
      if (isAccessingDashboard || isAccessingOnboarding || isAccessingPricing) {
        try {
          const urlStoreId = request.nextUrl.searchParams.get("storeId");
          let query = supabase.from("stores").select("id, subscription_tier, is_hq_sponsored").eq("user_id", user.id);
          
          if (urlStoreId) {
            query = query.eq("id", urlStoreId);
          } else {
            query = query.order("created_at", { ascending: false });
          }

          const { data: store } = await query.limit(1).maybeSingle();
          const hasStore = !!store;

          if (hasStore) {
            const effectiveTier = store.subscription_tier;
            console.log(`[Middleware] Normal User -> currentStoreId: ${store.id}, tier: ${effectiveTier}`);
          }

          if (!hasStore && (isAccessingDashboard || isAccessingPricing)) {
            const url = request.nextUrl.clone();
            url.pathname = "/onboarding";
            url.search = request.nextUrl.search;
            return NextResponse.redirect(url);
          }

          if (hasStore && isAccessingOnboarding) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            // urlStoreId가 없었다면 최신 매장 ID를 붙여줄 수도 있지만 일단 기존 파라미터 유지
            url.search = request.nextUrl.search;
            return NextResponse.redirect(url);
          }
        } catch (e) {
          // 에러 시 무시하고 다음으로 진행
        }
      }
    }
  }

  return supabaseResponse;
}
