"use client";

import { Field } from "@/components/ui";
import styles from "./auth-experience.module.css";

export function VerificationCodeInput({
  label, value, onChange, disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const normalize = (text: string) => text.replace(/\D/g, "").slice(0, 6);
  return (
    <Field label={label}>
      <span className={styles.otpControl}>
        <input
          className={styles.otpInput}
          aria-label={label}
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(normalize(e.target.value))}
          onPaste={(e) => {
            const code = normalize(e.clipboardData.getData("text"));
            if (code.length === 6) {
              e.preventDefault();
              onChange(code);
            }
          }}
        />
        <span className={styles.otpCells} aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <span key={index} data-active={index === Math.min(value.length, 5)}>{value[index]}</span>
          ))}
        </span>
      </span>
    </Field>
  );
}
