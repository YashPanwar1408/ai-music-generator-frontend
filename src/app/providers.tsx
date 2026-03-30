/* eslint-disable @typescript-eslint/unbound-method */
"use client";

import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { authClient } from "~/lib/auth-client";
import { DAISYUI_THEMES } from "~/lib/daisyui-themes";

export function Providers({ children }: { children: React.ReactNode }) {
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
        navigate={router.push}
        replace={router.replace}
        onSessionChange={() => {
          router.refresh();
        }}
        account={{
          basePath: "/dashboard",
        }}
        Link={Link}
      >
        {children}
      </AuthUIProvider>
    </ThemeProvider>
  );
}
