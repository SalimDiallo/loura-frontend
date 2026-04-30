"use client";

import { tokenManager } from "@/lib/api/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LandingAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (tokenManager.getAccessToken()) {
      router.replace("/core/dashboard");
    }
  }, [router]);

  return null;
}
