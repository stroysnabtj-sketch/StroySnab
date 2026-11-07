"use client";
import { AddressFields } from "./address-fields";
import type { MapPoint } from "./address-map";
import { DeliveryTimePicker } from "@/components/delivery-time-picker";
import { type DeliveryTimeSlot } from "@/modules/delivery/preferences";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Store,
  CreditCard,
  Banknote,
  Check,
  MapPin,
  UserRound,
} from "lucide-react";
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
  currentUser?: { phone?: string; fullName?: string };
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(true);
  const [quoteRefresh, setQuoteRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setName] = useState(currentUser?.fullName ?? "");
  const [customerPhone, setPhone] = useState(currentUser?.phone ?? "+992");
  const [city, setCity] = useState("Кушониён");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPayment] = useState("CASH_ON_DELIVERY");
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
        if (!response.ok) throw new Error(data.error?.message ?? "Не удалось рассчитать заказ");
        if (active) setQuote(data);
      })
      .catch((err) => {
        if (active) {
          setQuote(null);
          setError(err instanceof Error ? err.message : "Не удалось рассчитать заказ");
        }
      })
      .finally(() => {
        if (active) setQuoteLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fulfillment, quoteRefresh]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || !quote || quoteLoading) return;
    if (fulfillment === "DELIVERY" && !point) {
      setError("Укажите точку доставки на карте");
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
          deliveryCity: city,
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
      if (!response.ok) throw new Error(data.error?.message ?? "Не удалось оформить заказ");
      router.push(`/orders/${data.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось оформить заказ");
      setBusy(false);
      if (err instanceof Error && err.message.includes("Стоимость изменилась"))
        setQuoteRefresh((value) => value + 1);
    }
  }
  return (
    <form onSubmit={submit} className={`checkout-flow ${styles.checkout}`}>
      <Link className={styles.back} href="/cart">
        <ArrowLeft size={16} /> Вернуться в корзину
      </Link>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.eyebrow}>Последний шаг</span>
          <h1>Оформление заказа</h1>
          <p>Укажите контакты и выберите, как получить материалы.</p>
        </div>
        {!currentUser?.phone && (
          <Link href="/auth/login?next=%2Fcheckout" className={styles.signIn}>
            Есть аккаунт? Войти <UserRound size={16} />
          </Link>
        )}
      </header>
      <div className="checkout-grid">
        <div className="checkout-main">
          <section className="checkout-section">
            <h2 className={styles.sectionTitle}>
              <span>01</span> Получение заказа
            </h2>
            <fieldset className={styles.choices}>
              <legend className="sr-only">Способ получения</legend>
              {(
                [
                  ["DELIVERY", "Доставка", "На ваш адрес или строительный объект"],
                  ["PICKUP", "Самовывоз", "Со склада магазина после подтверждения"],
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
                    <strong>{title}</strong>
                    <small>{detail}</small>
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
                canSave={!!currentUser?.phone}
              />
            ) : (
              <p className={styles.notice}>
                <MapPin size={18} /> Магазин сообщит адрес склада и время выдачи после подтверждения
                заказа.
              </p>
            )}
          </section>
          <section className="checkout-section">
            <h2 className={styles.sectionTitle}>
              <span>02</span> Контакты получателя
            </h2>
            <div className={styles.twoFields}>
              <label className="field">
                Имя
                <input
                  className="input"
                  required
                  minLength={2}
                  maxLength={120}
                  autoComplete="name"
                  placeholder="Как к вам обращаться"
                  value={customerName}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="field">
                Телефон
                <input
                  className="input"
                  type="tel"
                  required
                  pattern="\+?[0-9 ()-]{9,24}"
                  autoComplete="tel"
                  value={customerPhone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </div>
          </section>
          {fulfillment === "DELIVERY" && (
            <details className="checkout-section">
              <summary>Пожелания к доставке</summary>
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
            <h2 className={styles.sectionTitle}>
              <span>{fulfillment === "DELIVERY" ? "04" : "03"}</span> Оплата
            </h2>
            <fieldset className={styles.choices}>
              <legend className="sr-only">Способ оплаты</legend>
              {(
                [
                  ["CASH_ON_DELIVERY", "При получении", "Оплата после подтверждения заказа"],
                  ["BANK_INVOICE", "По счёту", "Для организаций и безналичной оплаты"],
                ] as const
              ).map(([value, title, detail]) => (
                <label
                  className={styles.choice}
                  data-selected={paymentMethod === value}
                  key={value}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={value}
                    checked={paymentMethod === value}
                    onChange={() => setPayment(value)}
                  />
                  {value === "BANK_INVOICE" ? <CreditCard size={23} /> : <Banknote size={23} />}
                  <span>
                    <strong>{title}</strong>
                    <small>{detail}</small>
                  </span>
                  <Check className={styles.choiceCheck} size={17} />
                </label>
              ))}
            </fieldset>
            <label className="field">
              Комментарий к заказу <span className={styles.optional}>Необязательно</span>
              <textarea
                className="input"
                rows={3}
                maxLength={1000}
                placeholder="Ориентир, особенности подъезда или пожелания"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
          </section>
        </div>
        <aside className="checkout-summary checkout-section">
          <div className={styles.summaryHeading}>
            <h2>Ваш заказ</h2>
            <Link href="/cart">Изменить</Link>
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
              <p className={styles.helper}>Рассчитываем стоимость…</p>
            ) : (
              quote && (
                <>
                  <div>
                    <span>Материалы</span>
                    <strong>{formatTJS(quote.materialsTotalDirams)}</strong>
                  </div>
                  <div>
                    <span>{fulfillment === "PICKUP" ? "Получение" : "Доставка"}</span>
                    <span>{fulfillment === "PICKUP" ? "Самовывоз" : "Согласуем отдельно"}</span>
                  </div>
                  <div className={styles.total}>
                    <span>Итого за материалы</span>
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
              Повторить расчёт
            </Button>
          )}
          <Button
            className={styles.submit}
            type="submit"
            loading={busy}
            disabled={quoteLoading || !quote}
          >
            {busy ? "Оформляем…" : "Оформить заказ"}
          </Button>
        </aside>
      </div>
    </form>
  );
}
