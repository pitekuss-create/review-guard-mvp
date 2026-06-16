import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 로그인 여부 확인
  if (!user) {
    redirect("/login");
  }

  // 2. 권한 확인 (SUPER_ADMIN 팩트 체크)
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  const userRole = roleData?.role || "STORE_OWNER";

  // SUPER_ADMIN이 아니라면 강제 추방
  if (userRole !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
