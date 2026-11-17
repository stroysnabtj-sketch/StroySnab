"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, DataTable, Field, Input, adminRequest } from "@/components/admin-ui";
import { formatTJS } from "@/modules/system/money";
import { formatDateTime } from "@/i18n";
import styles from "@/components/workspace-design.module.css";

type ReferralEntry = {
  id: string;
  status: string;
  bonusAmountDirams: string | null;
  createdAt: string;
  referrerName: string;
  referrerPhone: string | null;
  referredName: string;
  referredPhone: string | null;
};

type AdminReferralData = {
  bonusPercent: string;
  summary: {
    invitedTotal: number;
    pendingCount: number;
    creditedCount: number;
    creditedDirams: string;
  };
  items: ReferralEntry[];
};

const BONUS_STATUS_LABELS: Record<string, string> = {
  PENDING: "Ожидает заказа",
  CREDITED: "Начислен",
  CANCELLED: "Отменён",
};

export function AdminReferralsPanel({ initialData }: { initialData: AdminReferralData }) {
  const router = useRouter();
  const [bonusPercent, setBonusPercent] = useState(initialData.bonusPercent);
  const [savedPercent, setSavedPercent] = useState(initialData.bonusPercent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function saveRate(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await adminRequest<{ bonusPercent: string }>("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusPercent }),
      });
      setBonusPercent(res.bonusPercent);
      setSavedPercent(res.bonusPercent);
      setMessage(`Ставка бонуса обновлена: ${res.bonusPercent}%`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить ставку бонуса");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 22 }}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>Настройка реферального бонуса</h2>
          <Badge tone="info">Текущая ставка: {savedPercent}%</Badge>
        </div>
        <p className={styles.subtle} style={{ marginBottom: 16 }}>
          При первом доставленном заказе приглашённого покупателя пригласившему начисляется указанный
          процент от суммы материалов заказа. Укажите 0, чтобы временно приостановить начисления.
        </p>
        <form onSubmit={saveRate} className={styles.filterForm} style={{ alignItems: "end" }}>
          <Field label="Размер бонуса, %">
            <Input
              type="text"
              inputMode="decimal"
              required
              value={bonusPercent}
              onChange={(e) => setBonusPercent(e.target.value)}
              placeholder="2"
            />
          </Field>
          <Button type="submit" loading={busy}>
            Сохранить ставку
          </Button>
        </form>
        {message && (
          <p className="form-success" role="status" style={{ marginTop: 12 }}>
            {message}
          </p>
        )}
        {error && (
          <p className="form-alert" role="alert" style={{ marginTop: 12 }}>
            {error}
          </p>
        )}
      </section>

      <div className={styles.metrics}>
        <div className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Приглашено по ссылкам</span>
          </div>
          <strong>{initialData.summary.invitedTotal}</strong>
          <small>Всего связей регистраций</small>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Ожидают первого заказа</span>
          </div>
          <strong>{initialData.summary.pendingCount}</strong>
          <small>Ожидают статуса «Доставлен»</small>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Начислений выполнено</span>
          </div>
          <strong>{initialData.summary.creditedCount}</strong>
          <small>Подтверждённые выплаты бонуса</small>
        </div>
        <div className={styles.metric}>
          <div className={styles.metricTop}>
            <span>Всего начислено</span>
          </div>
          <strong>{formatTJS(initialData.summary.creditedDirams)}</strong>
          <small>По действующим правилам ({savedPercent}%)</small>
        </div>
      </div>

      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <h2>История реферальных бонусов</h2>
          <Badge>{initialData.items.length} зап.</Badge>
        </div>
        {initialData.items.length ? (
          <DataTable headers={["Пригласил", "Приглашённый", "Статус", "Бонус", "Дата"]}>
            {initialData.items.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.referrerName}</strong>
                  {item.referrerPhone && (
                    <>
                      <br />
                      <small className="muted">{item.referrerPhone}</small>
                    </>
                  )}
                </td>
                <td>
                  <strong>{item.referredName}</strong>
                  {item.referredPhone && (
                    <>
                      <br />
                      <small className="muted">{item.referredPhone}</small>
                    </>
                  )}
                </td>
                <td>
                  <Badge
                    tone={
                      item.status === "CREDITED"
                        ? "success"
                        : item.status === "CANCELLED"
                          ? "danger"
                          : "info"
                    }
                  >
                    {BONUS_STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </td>
                <td>
                  <strong>
                    {item.bonusAmountDirams !== null ? formatTJS(item.bonusAmountDirams) : "—"}
                  </strong>
                </td>
                <td>
                  <small className="muted">{formatDateTime(item.createdAt)}</small>
                </td>
              </tr>
            ))}
          </DataTable>
        ) : (
          <p className={styles.emptyText}>Приглашённых покупателей пока нет.</p>
        )}
      </section>
    </div>
  );
}
