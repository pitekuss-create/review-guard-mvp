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

  if (
    !user &&
    (isAccessingDashboard || isAccessingOnboarding || isAccessingHQ)
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Allow passing if user is accessing login but is already logged in
  if (user && request.nextUrl.pathname.startsWith("/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // 🚀 [DO NOT REMOVE] HQ 라우팅 철통 방어 로직 (삭제 금지)
  if (user && isAccessingHQ) {
    const timeoutPromise = new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error("DB_TIMEOUT")), 3000)
    );

    try {
      const { data: roleData } = await Promise.race([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle(),
        timeoutPromise
      ]);

      if (!roleData || (roleData.role !== "HQ_ADMIN" && roleData.role !== "SUPER_ADMIN" && roleData.role !== "hq")) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard"; // 권한 없으면 일반 대시보드로 튕겨냄
        return NextResponse.redirect(url);
      }
      
      // HQ 권한 일치 시 명시적 반환 (Next.js 라우터 무한 대기 방지)
      return supabaseResponse;
    } catch (error) {
      // 타임아웃(3초) 또는 쿼리 에러 발생 시 안전하게 login으로 리다이렉트
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
