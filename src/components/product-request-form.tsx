"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

const UNITS = ["шт.", "м", "м²", "м³", "кг", "т", "упак.", "другое"] as const;

function getDushanbeDateStr(d: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dushanbe",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

type Props = {
  productName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  authenticated: boolean;
};

export function ProductRequestForm(props: Props) {
  const { tr } = useLocale();
  const todayStr = getDushanbeDateStr(new Date());
  const maxDateStr = (() => {
    const y = Number(todayStr.slice(0, 4)) + 2;
    return `${y}${todayStr.slice(4)}`;
  })();

  const [form, setForm] = useState({
    productName: props.productName,
    description: "",
    quantity: "",
    unit: "",
    customUnit: "",
    requiredDate: "",
    contactName: props.contactName,
    contactPhone: props.contactPhone,
    contactEmail: props.contactEmail,
    website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState<{ number: string } | null>(null);
  const [message, setMessage] = useState("");

  const set = (key: keyof typeof form, value: string) =>
    setForm((old) => ({ ...old, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setErrors({});
    setMessage("");

    const unitValue = form.unit === "другое" ? form.customUnit.trim() : form.unit;

    try {
      const response = await fetch("/api/product-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          description: form.description || null,
          quantity: form.quantity || null,
          unit: unitValue || null,
          requiredDate: form.requiredDate || null,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail || null,
          website: form.website,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const fieldErrors = result.error?.fields ?? {};
        setErrors(fieldErrors);
        setMessage(result.error?.message ?? tr("Проверьте форму"));

        // Focus first errored field
        const firstKey = Object.keys(fieldErrors)[0];
        if (firstKey) {
          const el = document.querySelector<HTMLElement>(
            `[name="${firstKey}"], [data-field="${firstKey}"] input, [data-field="${firstKey}"] select, [data-field="${firstKey}"] textarea`,
          );
          el?.focus();
        }
        return;
      }

      setSuccess(result);
    } catch {
      setErrors({ root: "Ошибка сети. Попробуйте позже." });
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <div className="request-success">
        <span className="eyebrow">{tr("Заявка принята")}</span>
        <h2>{success.number}</h2>
        <p>{tr("Мы ответим в ближайшее время. Менеджер проверит наличие и свяжется с вами.")}</p>
        <div className="hero-actions">
          <Button
            variant="secondary"
            onClick={() => {
              setSuccess(null);
              setForm({
                ...form,
                productName: "",
                description: "",
                quantity: "",
                unit: "",
                customUnit: "",
              });
            }}
          >
            {tr("Создать ещё заявку")}
          </Button>
          <Link
            className="button button-primary"
            href={props.authenticated ? "/account/requests" : "/catalog"}
          >
            {props.authenticated ? tr("Мои заявки") : tr("В каталог")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="stack-form request-form" onSubmit={submit} noValidate>
      {errors.root ? (
        <div className="form-alert" role="alert">
          {errors.root}
        </div>
      ) : null}
      {message && !errors.root ? (
        <div className="form-alert" role="alert">
          {message}
        </div>
      ) : null}

      <Field label={tr("Название товара *")} error={errors.productName}>
        <Input
          required
          aria-required="true"
          aria-describedby={errors.productName ? "err-productName" : undefined}
          name="productName"
          value={form.productName}
          onChange={(e) => set("productName", e.target.value)}
          placeholder={tr("Например: арматура А500С Ø12")}
        />
      </Field>

      <Field
        label={tr("Описание")}
        hint={`${form.description.length}/2000. Марка, размеры, ГОСТ, бренд`}
        error={errors.description}
      >
        <Textarea
          maxLength={2000}
          aria-describedby={errors.description ? "err-description" : undefined}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="form-grid">
        <Field label={tr("Количество")} error={errors.quantity}>
          <Input
            inputMode="decimal"
            aria-describedby={errors.quantity ? "err-quantity" : undefined}
            value={form.quantity}
            onChange={(e) => set("quantity", e.target.value)}
          />
        </Field>
        <Field label={tr("Единица")} error={errors.unit}>
          <Select
            aria-describedby={errors.unit ? "err-unit" : undefined}
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
          >
            <option value="">{tr("Выберите")}</option>
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {tr(u)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {form.unit === "другое" ? (
        <Field label={tr("Укажите единицу *")} error={errors.customUnit}>
          <Input
            required
            aria-required="true"
            maxLength={20}
            value={form.customUnit}
            onChange={(e) => set("customUnit", e.target.value)}
            placeholder={tr("До 20 символов")}
          />
        </Field>
      ) : null}

      <Field label={tr("Нужен к дате")} error={errors.requiredDate}>
        <Input
          type="date"
          min={todayStr}
          max={maxDateStr}
          aria-describedby={errors.requiredDate ? "err-requiredDate" : undefined}
          value={form.requiredDate}
          onChange={(e) => set("requiredDate", e.target.value)}
        />
      </Field>

      <div className="form-grid">
        <Field label={tr("Контактное имя *")} error={errors.contactName}>
          <Input
            required
            aria-required="true"
            aria-describedby={errors.contactName ? "err-contactName" : undefined}
            value={form.contactName}
            onChange={(e) => set("contactName", e.target.value)}
          />
        </Field>
        <Field label={tr("Телефон *")} error={errors.contactPhone}>
          <Input
            required
            aria-required="true"
            type="tel"
            aria-describedby={errors.contactPhone ? "err-contactPhone" : undefined}
            value={form.contactPhone}
            onChange={(e) => set("contactPhone", e.target.value)}
            placeholder="+992 xx xxx xx xx"
          />
        </Field>
      </div>

      <Field label="E-mail" error={errors.contactEmail}>
        <Input
          type="email"
          aria-describedby={errors.contactEmail ? "err-contactEmail" : undefined}
          value={form.contactEmail}
          onChange={(e) => set("contactEmail", e.target.value)}
        />
      </Field>

      <div className="honeypot" aria-hidden="true">
        <label>
          {tr("Веб-сайт")}
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set("website", e.target.value)}
          />
        </label>
      </div>

      <Button type="submit" loading={pending}>
        {tr("Отправить заявку")}
      </Button>

      <p className="form-legal">
        {tr("Отправляя заявку, вы соглашаетесь с")}{" "}
        <Link className="inline-link" href="/terms" target="_blank" rel="noopener noreferrer">
          {tr("пользовательским соглашением")}
        </Link>{" "}
        {tr("и обработкой контактных данных.")}
      </p>
    </form>
  );
}
