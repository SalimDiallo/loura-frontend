"use client";

import { tokenManager } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LandingAuthRedirect({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (tokenManager.getAccessToken()) {
      router.replace("/core/dashboard");
      // no need to show landing content while redirecting
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) return null;

  return <>{children}</>;
}
