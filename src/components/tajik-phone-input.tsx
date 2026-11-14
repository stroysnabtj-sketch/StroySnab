"use client";
import { useState } from "react";
import styles from "./tajik-phone-input.module.css";
const national = (value: string) => {
  let digits = value.replace(/\D/g, "");
  if (value.startsWith("+992") || (digits.length > 9 && digits.startsWith("992")))
    digits = digits.slice(3);
  return digits.slice(0, 9);
};
const format = (value: string) =>
  [value.slice(0, 3), value.slice(3, 5), value.slice(5, 7), value.slice(7, 9)]
    .filter(Boolean)
    .join(" ");
export function TajikPhoneInput({
  name = "contactPhone",
  defaultValue = "",
  required = true,
}: {
  name?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  const [digits, setDigits] = useState(() => national(defaultValue));
  return (
    <span className={styles.phone}>
      <span aria-hidden="true">+992</span>
      <input
        type="tel"
        aria-label="Телефон"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="000 00 00 00"
        pattern="[0-9]{3} [0-9]{2} [0-9]{2} [0-9]{2}"
        required={required}
        maxLength={26}
        value={format(digits)}
        onChange={(event) => setDigits(national(event.target.value))}
      />
      <input type="hidden" name={name} value={digits ? `+992${digits}` : ""} />
    </span>
  );
}
