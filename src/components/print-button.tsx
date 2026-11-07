"use client";

import { Printer } from "lucide-react";

export function PrintButton({ orderId }: { orderId: string }) {
  return (
    <a
      className="button button-secondary"
      href={`/orders/${encodeURIComponent(orderId)}/pdf`}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Printer size={16} /> Накладная PDF
    </a>
  );
}
