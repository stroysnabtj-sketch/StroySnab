"use client";
import { useLocale } from "@/i18n/provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { t } from "@/i18n";
export function LogoutButton() {
  const { tr } = useLocale();
  const router = useRouter();
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      {tr(t("common.logout"))}
    </Button>
  );
}
