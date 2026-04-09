"use client";

import { AccountView } from "@daveyplate/better-auth-ui";
import { ArrowLeftIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "~/components/ui/button";

export function DashboardAccountView({ pathname }: { pathname: string }) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl py-12 px-4">
      <Button
        className="self-start"
        variant="outline"
        onClick={() => router.back()}
      >
        <ArrowLeftIcon />
        Back
      </Button>
      <AccountView pathname={pathname} />
    </div>
  );
}
