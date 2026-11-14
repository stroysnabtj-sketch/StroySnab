"use client";
import { useLocale } from "@/i18n/provider";
export default function ReferralError({ reset }: { reset: () => void }) {
  const { tr } = useLocale();
  return (
    <div className="shell" role="alert" style={{ paddingBlock: 40 }}>
      <h1>{tr("Не удалось загрузить приглашения")}</h1>
      <button className="button button-primary" onClick={reset}>
        {tr("Попробовать снова")}
      </button>
    </div>
  );
}
