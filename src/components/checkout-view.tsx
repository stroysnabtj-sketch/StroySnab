"use client";
import { useLocale } from "@/i18n/provider";
import { AddressFields } from "./address-fields";
import type { MapPoint } from "./address-map";
import { DeliveryTimePicker } from "@/components/delivery-time-picker";
import { type DeliveryTimeSlot } from "@/modules/delivery/preferences";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, Store, Banknote, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui";
import styles from "./purchase-experience.module.css";
import { useRouter } from "next/navigation";
import { formatTJS } from "@/modules/system/money";
type CartItem = {
  id: string;
  productName: string;
  sku: string;
  unit: string;
  qty: string;
  priceDirams: string;
  subtotalDirams: string;
};
type Quote = {
  items: Array<{
    offerId: string;
    productName: string;
    qty: string;
    unit: string;
    subtotalDirams: string;
  }>;
  materialsTotalDirams: string;
  deliveryTotalDirams: string;
  totalDirams: string;
};
export function CheckoutView({
  initialCart,
  currentUser,
}: {
  initialCart: { id: string | null; items: CartItem[]; totalDirams: string };
  currentUser?: { phone?: string; email?: string; fullName?: string };
}) {
  const { tr } = useLocale();
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setName] = useState(currentUser?.fullName ?? "");
  const [customerPhone, setPhone] = useState(currentUser?.phone || "");
  const [customerEmail, setEmail] = useState(currentUser?.email ?? "");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const paymentMethod = "CASH_ON_DELIVERY" as const;
  const [point, setPoint] = useState<MapPoint | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliverySlot, setDeliverySlot] = useState<DeliveryTimeSlot | "">("");

  useEffect(() => {
    let active = true;
    setQuoteLoading(true);
    setError("");
    fetch("/api/public/orders/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillment }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message ?? tr("Не удалось рассчитать заказ"));
        if (active) setQuote(data);
      })
      .catch((err) => {
        if (active) {
          setQuote(null);
          setError(err instanceof Error ? err.message : tr("Не удалось рассчитать заказ"));
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fulfillment, quoteRefresh, tr]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !quote || quoteLoading) return;
    if (
      fulfillment === "DELIVERY" &&
      !point &&
      !notes.trim() &&
      (city.trim().length < 2 || address.trim().length < 5)
    ) {
      setError(tr("Укажите точку на карте, адрес или комментарий"));
      return;
    }
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: key.current,
          expectedTotalDirams: quote.totalDirams,
          customerName,
          customerPhone,
          customerEmail: customerEmail.trim() || undefined,
          deliveryCity: fulfillment === "PICKUP" ? city || "Кушониён" : city,
          deliveryAddress: address,
          deliveryNotes: notes,
          fulfillment,
          paymentMethod,
          ...(fulfillment === "DELIVERY"
            ? {
                deliveryLat: point?.lat,
                deliveryLng: point?.lng,
                preferredDeliveryDate: deliveryDate || undefined,
                preferredTimeSlot: deliverySlot || undefined,
              }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? tr("Не удалось оформить заказ"));
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Не удалось оформить заказ"));
      setBusy(false);
      if (err instanceof Error && err.message.includes("Стоимость изменилась"))
        setQuoteRefresh((value) => value + 1);
    }
  }
  const commentField = (
    <label className="field">
      {fulfillment === "DELIVERY" ? tr("Комментарий к адресу") : tr("Комментарий к заказу")}
      <textarea
        className="input"
        rows={3}
        maxLength={1000}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
    </label>
  );
  return (
    <form onSubmit={submit} className={`checkout-flow ${styles.checkout}`}>
      <Link className={styles.back} href="/cart">
        <ArrowLeft size={16} /> {tr("Вернуться в корзину")}
      </Link>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>{tr("Последний шаг")}</span>
          <h1>{tr("Оформление заказа")}</h1>
          <p>{tr("Укажите контакты и выберите, как получить материалы.")}</p>
        </div>
      </header>
      <div className="checkout-grid">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2 className={styles.sectionTitle}>{tr("Получение заказа")}</h2>
            <fieldset className={styles.choices}>
              <legend className="sr-only">{tr("Способ получения")}</legend>
              {(
                [
                  ["DELIVERY", "Доставка", tr("На ваш адрес или строительный объект")],
                  ["PICKUP", tr("Самовывоз"), tr("Со склада после подтверждения")],
                ] as const
              ).map(([value, title, detail]) => (
                <label className={styles.choice} data-selected={fulfillment === value} key={value}>
                  <input
                    type="radio"
                    name="fulfillment"
                    value={value}
                    checked={fulfillment === value}
                    onChange={() => setFulfillment(value)}
                  />
                  {value === "DELIVERY" ? <Truck size={23} /> : <Store size={23} />}
                  <span>
                    <strong>{tr(title)}</strong>
                    <small>{tr(detail)}</small>
                  </span>
                  <Check className={styles.choiceCheck} size={17} />
                </label>
              ))}
            </fieldset>
            {fulfillment === "DELIVERY" ? (
              <AddressFields
                value={{ city, street: address, point }}
                onChange={(next) => {
                  setCity(next.city);
                  setAddress(next.street);
                  setPoint(next.point);
                }}
                canSave={!!currentUser}
                requireStreet={false}
              >
                {commentField}
              </AddressFields>
            ) : (
              <p className={styles.notice}>
                <MapPin size={18} /> Менеджер сообщит адрес склада и время выдачи после
                подтверждения заказа.
              </p>
            )}
          </section>
          <section className="checkout-section">
            <h2 className={styles.sectionTitle}>{tr("Контакты получателя")}</h2>
            <div className={styles.twoFields}>
              <label className="field">
                Имя
                <input
                  className="input"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder={tr("Как к вам обращаться")}
                  value={customerName}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                Телефон
                <span className={styles.phoneInput}>
                  <span aria-hidden="true">+992</span>
                  <input
                    type="tel"
                    aria-label="Телефон"
                    required
                    inputMode="numeric"
                    pattern="[0-9]{3} [0-9]{2} [0-9]{2} [0-9]{2}"
                    autoComplete="tel-national"
                    placeholder="000 00 00 00"
                    value={customerPhone
                      .replace(/^\+?992/, "")
                      .replace(/\D/g, "")
                      .slice(0, 9)
                      .replace(/^(\d{3})(\d{0,2})(\d{0,2})(\d{0,2}).*$/, (_, a, b, c, d) =>
                        [a, b, c, d].filter(Boolean).join(" "),
                      )}
                    onChange={(e) => {
                      let digits = e.target.value.replace(/\D/g, "");
                      if (
                        e.target.value.startsWith("+992") ||
                        (digits.length === 12 && digits.startsWith("992"))
                      )
                        digits = digits.slice(3);
                      setPhone(digits ? `+992${digits.slice(0, 9)}` : "");
                    }}
                  />
                </span>
              </label>
              <label className="field">
                {tr("E-mail (необязательно)")}
                <input
                  className="input"
                  type="email"
                  maxLength={254}
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={customerEmail}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>
          </section>
          {fulfillment === "DELIVERY" && (
            <details className="checkout-section">
              <summary>{tr("Пожелания к доставке")}</summary>
              <DeliveryTimePicker
                date={deliveryDate}
                slot={deliverySlot}
                onChange={(date, slot) => {
                  setDeliveryDate(date);
                  setDeliverySlot(slot);
                }}
              />
            </details>
          )}
          <section className="checkout-section">
            <h2 className={styles.sectionTitle}>{tr("Оплата")}</h2>
            <div className={styles.cashPayment}>
              <Banknote size={22} aria-hidden="true" />
              <span>{tr("Наличными при получении")}</span>
            </div>
            {fulfillment === "PICKUP" && commentField}
          </section>
        </div>
        <aside className="checkout-summary checkout-section">
          <div className={styles.summaryHeading}>
            <h2>{tr("Ваш заказ")}</h2>
            <Link href="/cart">{tr("Изменить")}</Link>
          </div>
          <ul className={styles.orderItems}>
            {(quote?.items ?? initialCart.items).map((item, index) => (
              <li key={"offerId" in item ? item.offerId : item.id}>
                <span className={styles.itemNumber}>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <strong>{item.productName}</strong>
                  <small>
                    {item.qty} {item.unit}
                  </small>
                </div>
                <b>{quote ? formatTJS(item.subtotalDirams) : "—"}</b>
              </li>
            ))}
          </ul>
          <div className={styles.costs} aria-live="polite" aria-busy={quoteLoading}>
            {quoteLoading ? (
              <p className={styles.helper}>{tr("Рассчитываем стоимость…")}</p>
            ) : (
              quote && (
                <>
                  <div>
                    <span>{tr("Материалы")}</span>
                    <strong>{formatTJS(quote.materialsTotalDirams)}</strong>
                  </div>
                  <div>
                    <span>{fulfillment === "PICKUP" ? tr("Получение") : "Доставка"}</span>
                    <span>
                      {fulfillment === "PICKUP" ? tr("Самовывоз") : tr("Согласуем отдельно")}
                    </span>
                  </div>
                  <div className={styles.total}>
                    <span>{tr("Итого за материалы")}</span>
                    <strong>{formatTJS(quote.totalDirams)}</strong>
                  </div>
                </>
              )
            )}
          </div>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          {!quote && !quoteLoading && (
            <Button type="button" variant="secondary" onClick={() => setQuoteRefresh((v) => v + 1)}>
              {tr("Повторить расчёт")}
            </Button>
          )}
          <Button
            className={styles.submit}
            type="submit"
            loading={busy}
            disabled={quoteLoading || !quote}
          >
            {busy ? tr("Оформляем…") : tr("Оформить заказ")}
          </Button>
        </aside>
      </div>
    </form>
  );
}
