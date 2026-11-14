import { getTranslator } from "@/i18n/server";
export default async function ReferralLoading() {
  const tr = await getTranslator();
  return (
    <div className="shell" role="status" aria-live="polite" style={{ paddingBlock: 40 }}>
      {tr("Загружаем приглашения…")}
    </div>
  );
}
