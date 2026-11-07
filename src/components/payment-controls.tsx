"use client";
import { CustomSelect } from "@/components/custom-select";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatTJS, toDirams } from "@/modules/system/money";

export function PaymentControls({
  id,
  paidDirams,
  balanceDirams,
  cancelled,
}: {
  id: string;
  paidDirams: string;
  balanceDirams: string;
  cancelled: boolean;
}) {
  const router = useRouter();
  const [kind, setKind] = useState("PAYMENT");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const attempt = useRef<{ signature: string; key: string } | null>(null);
  const inFlight = useRef(false);
  const maximum = kind === "PAYMENT" ? balanceDirams : paidDirams;
  const unavailable = BigInt(maximum) <= 0n || (kind === "PAYMENT" && cancelled);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || unavailable) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setError("");
    setSuccess("");
    try {
      const amount = toDirams(String(fields.get("amount") ?? ""));
      if (amount <= 0n || amount > BigInt(maximum))
        throw new Error("Укажите сумму больше нуля в пределах доступного остатка.");
      const payload = {
        kind,
        amountDirams: amount.toString(),
        reason: String(fields.get("reason") ?? "").trim(),
        method: String(fields.get("method")),
        reference: String(fields.get("reference") ?? "").trim(),
      };
      if (payload.reason.length < 3)
        throw new Error("Укажите основание операции (не менее 3 символов).");
      const signature = JSON.stringify(payload);
      if (attempt.current?.signature !== signature)
        attempt.current = { signature, key: crypto.randomUUID() };
      inFlight.current = true;
      setPending(true);
      const response = await fetch(`/api/admin/orders/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, idempotencyKey: attempt.current.key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "Не удалось сохранить операцию");
      form.reset();
      attempt.current = null;
      setSuccess("Операция сохранена. Данные обновляются.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Нет связи с сервером. Повторите попытку.");
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  return (
    <form onSubmit={save} style={{ display: "grid", gap: 14, marginTop: 20 }}>
      <p className="muted" style={{ margin: 0 }}>
        Фиксируйте только фактически полученные деньги или выполненный возврат. Запись не проводит
        банковский перевод.
      </p>
      <label>
        Операция
        <CustomSelect
          className="input"
          name="kind"
          aria-label="Операция"
          value={kind}
          disabled={pending}
          onChange={(event) => {
            setKind(event.target.value);
            setError("");
            setSuccess("");
          }}
        >
          <option value="PAYMENT">Получена оплата</option>
          <option value="REFUND">Выполнен возврат</option>
        </CustomSelect>
      </label>
      <p className="muted" style={{ margin: 0 }}>
        {kind === "PAYMENT" ? "Доступно к оплате" : "Доступно к возврату"}: {formatTJS(maximum)}
        {cancelled && kind === "PAYMENT" ? ". Заказ отменён: приём оплаты закрыт." : ""}
      </p>
      <fieldset
        disabled={pending || unavailable}
        style={{ border: 0, padding: 0, margin: 0, minWidth: 0, display: "grid", gap: 14 }}
      >
        <label>
          Сумма, TJS
          <input
            className="input"
            name="amount"
            inputMode="decimal"
            required
            placeholder="0,00"
            maxLength={18}
          />
        </label>
        <label>
          Способ
          <CustomSelect className="input" name="method" aria-label="Способ">
            <option value="BANK_TRANSFER">Банковский перевод</option>
            <option value="CASH">Наличные</option>
            <option value="OTHER">Другой</option>
          </CustomSelect>
        </label>
        <label>
          Номер документа (необязательно)
          <input className="input" name="reference" maxLength={200} />
        </label>
        <label>
          Основание
          <textarea
            className="input"
            name="reason"
            required
            minLength={3}
            maxLength={1000}
            rows={3}
            placeholder="Например, оплата по банковской выписке"
          />
        </label>
        <button className="button button-primary" type="submit">
          {pending
            ? "Сохранение…"
            : kind === "PAYMENT"
              ? "Записать получение оплаты"
              : "Записать возврат"}
        </button>
      </fieldset>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      {success && <p role="status">{success}</p>}
    </form>
  );
}
