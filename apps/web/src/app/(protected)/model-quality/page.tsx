import { cookies } from "next/headers";
import { AUTH_ROLE_COOKIE, isRoleName, type RoleName } from "@/lib/auth";
import { ModelQualityDashboardContent } from "./dashboard-content";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ModelQualityPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const roleValue = cookieStore.get(AUTH_ROLE_COOKIE)?.value;
  const activeRole: RoleName = isRoleName(roleValue) ? roleValue : "ANALYST_QUALITY";

  return (
    <ModelQualityDashboardContent
      activeRole={activeRole}
      searchParams={(await searchParams) ?? {}}
    />
  );
}
