"use client";

import { useState, type FormEvent } from "react";
import { adminRequest, Button } from "@/components/admin-ui";
import type { getDocumentProviderSettings } from "@/modules/procurement/document-provider-settings";

type ProviderSettings = Awaited<ReturnType<typeof getDocumentProviderSettings>>;

export function AdminAiProviderForm({ initial }: { initial: ProviderSettings }) {
  const [active, setActive] = useState<string>(initial.active);
  const [selected, setSelected] = useState<string>(initial.active);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || selected === active || !initial.providers.some((p) => p.id === selected && p.configured))
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await adminRequest<{ provider: string }>("/api/admin/ai-providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selected }),
      });
      setActive(result.provider);
      setSelected(result.provider);
      setNotice("Провайдер сохранён");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить провайдера");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card" onSubmit={save}>
      {!initial.enabled && <p>Автоматический расчёт отключён на сервере.</p>}
      <label htmlFor="quotation-provider">Провайдер разбора документов</label>
      <select id="quotation-provider" value={selected} disabled={busy} onChange={(e) => {
        setSelected(e.target.value);
        setNotice("");
        setError("");
      }}>
        {initial.providers.map((provider) => (
          <option key={provider.id} value={provider.id} disabled={!provider.configured}>
            {provider.label} ({provider.model}){provider.configured ? "" : " · ключ не задан"}
          </option>
        ))}
      </select>
      <p>Выбор применяется, когда обработчик начинает новую заявку.</p>
      <Button type="submit" disabled={busy || selected === active}>
        {busy ? "Сохраняем…" : "Сохранить"}
      </Button>
      {notice && <p role="status">{notice}</p>}
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
