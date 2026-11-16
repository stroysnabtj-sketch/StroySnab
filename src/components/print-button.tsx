"use client";

import { useLocale } from "@/i18n/provider";
import { Printer } from "lucide-react";

export function PrintButton({ orderId }: { orderId: string }) {
  const { tr } = useLocale();
  return (
    <a
      className="button button-secondary"
      href={`/orders/${encodeURIComponent(orderId)}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Printer size={16} /> {tr("Накладная PDF")}
    </a>
  );
}
