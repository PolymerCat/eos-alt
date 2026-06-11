"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const AUTH_TOAST_MESSAGES: Record<string, { title: string; description: string }> = {
  login_success: {
    title: "Signed in successfully",
    description: "Welcome back to Emergency OS.",
  },
};

/**
 * Displays one-time authentication feedback after a server-action redirect.
 * The query signal is removed immediately so refreshing the page does not
 * repeat the toast.
 */
export default function AuthToast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authToast = searchParams.get("authToast");

  useEffect(() => {
    if (!authToast) return;

    const message = AUTH_TOAST_MESSAGES[authToast];
    if (message) {
      toast.success(message.title, { description: message.description });
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("authToast");
    const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [authToast, pathname, router, searchParams]);

  return null;
}

