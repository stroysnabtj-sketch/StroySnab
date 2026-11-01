"use client";

import { X } from "lucide-react";
import { useEffect, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

export function Button({ children, variant = "primary", className = "", loading = false, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; loading?: boolean }) {
  return <button aria-label={typeof children === "string" ? children : undefined} className={`button button-${variant} ${className}`} disabled={disabled || loading} {...props}><span className="button-label" data-label={typeof children === "string" ? children : undefined}>{children}</span></button>;
}

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && !error ? <span className="field-hint">{hint}</span> : null}{error ? <span className="field-error" role="alert">{error}</span> : null}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...props} />; }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select className="input" {...props} />; }
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
