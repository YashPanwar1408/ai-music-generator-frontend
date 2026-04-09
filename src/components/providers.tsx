"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { authClient } from "~/lib/auth-client";
import { DAISYUI_THEMES } from "~/lib/daisyui-themes";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      themes={[...DAISYUI_THEMES]}
    >
      <AuthUIProvider
        authClient={authClient}
        navigate={(path) => router.push(path)}
        replace={(path) => router.replace(path)}
        onSessionChange={() => {
          // Clear router cache (protected routes)
          router.refresh();
        }}
        Link={Link}
      >
        {children}
      </AuthUIProvider>
    </ThemeProvider>
  );
}
