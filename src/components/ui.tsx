"use client";

import { X } from "lucide-react";
import { CustomSelect } from "./custom-select";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

function extractLabel(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractLabel).filter(Boolean).join(" ").trim();
  if (node && typeof node === "object" && "props" in node) {
    const p = (node as { props?: { children?: ReactNode } }).props;
    if (p?.children) return extractLabel(p.children);
  }
  return "";
}

export function Button({
  children,
  variant = "primary",
  className = "",
  loading = false,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
}) {
  const textLabel = typeof children === "string" ? children : extractLabel(children);

  let iconNode: ReactNode = null;
  let textNode: ReactNode = children;

  if (Array.isArray(children)) {
    const icons: ReactNode[] = [];
    const texts: ReactNode[] = [];
    for (const child of children) {
      if (typeof child === "string" || typeof child === "number") {
        texts.push(child);
      } else if (child && typeof child === "object") {
        icons.push(child);
      } else {
        texts.push(child);
      }
    }
    if (icons.length > 0 && texts.length > 0) {
      iconNode = icons;
      textNode = texts;
    }
  }

  return (
    <button
      aria-label={textLabel || undefined}
      className={`button button-${variant} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {iconNode}
      <span className="button-label" data-label={textLabel || undefined}>
        {textNode}
      </span>
    </button>
  );
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && !error ? <span className="field-hint">{hint}</span> : null}{error ? <span className="field-error" role="alert">{error}</span> : null}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...props} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <CustomSelect {...props} />; }
export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className="input" {...props} />; }
export function Checkbox({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode }) {
  return <label className="checkbox"><input type="checkbox" {...props} /><span>{label}</span></label>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "info" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) { return <div className={`card ${className}`}>{children}</div>; }

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X size={20} /></button></div>{children}</section></div>;
}

export function Toast({ children, text, tone = "success", onClose }: { children?: ReactNode; text?: string; tone?: "success" | "error"; onClose?: () => void }) { useEffect(() => { if (!onClose) return; const timer = setTimeout(onClose, 4000); return () => clearTimeout(timer); }, [onClose]); return <div className={`toast toast-${tone}`} role="status">{text ?? children}{onClose && <button className="icon-button" onClick={onClose} aria-label="Закрыть"><X size={15} /></button>}</div>; }
export function Skeleton({ className = "" }: { className?: string }) { return <div className={`skeleton ${className}`} aria-hidden="true" />; }
export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) { return <div className="empty"><h3>{title}</h3>{text ? <p>{text}</p> : null}{action}</div>; }
export function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav className="pagination" aria-label="Пагинация"><Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Назад</Button><span>{page} / {pages}</span><Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>Далее</Button></nav>;
}
export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}
