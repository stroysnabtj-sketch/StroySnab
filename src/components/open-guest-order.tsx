"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function OpenGuestOrder({ id }: { id: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (!token) {
      setFailed(true);
      return;
    }
    const controller = new AbortController();
    const path = `/orders/${encodeURIComponent(id)}`;
    void fetch(`${path}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("invalid_link");
        if (!controller.signal.aborted) window.location.replace(path);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [id]);
  return (
    <main className="shell">
      <h1>Статус заказа</h1>
      <p role="status">{failed ? "Ссылка недействительна или истекла" : "Открываем заказ…"}</p>
      {failed && <Link href="/">На главную</Link>}
    </main>
  );
}
