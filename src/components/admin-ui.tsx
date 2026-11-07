"use client";
import {
  Children,
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { LoaderCircle, X } from "lucide-react";
import styles from "./workspace-design.module.css";
export { Badge, Button, Field, Input, Select, Textarea, Toast, Pagination } from "./ui";

export async function adminRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch {
    throw new Error("Нет связи с сервером. Проверьте подключение и повторите действие.");
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(data?.error?.message ?? "Не удалось выполнить действие. Попробуйте ещё раз.");
  if (data === null) throw new Error("Сервер вернул некорректный ответ");
  return data as T;
}
export function useAdminResource<T>(url: string) {
  const [data, setData] = useState<T | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const active = useRef<AbortController | null>(null);
  const reload = useCallback(async () => {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setError("");
    try {
      const result = await adminRequest<T>(url, { signal: controller.signal });
      if (!controller.signal.aborted) setData(result);
    } catch (e) {
      if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Ошибка сети");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void reload();
    return () => active.current?.abort();
  }, [reload]);
  return { data, loading, error, reload };
}
export function ResourceState({
  loading,
  error,
  empty,
  onRetry,
  emptyText = "Ничего не найдено. Измените условия поиска.",
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  onRetry: () => void;
  emptyText?: string;
}) {
  if (error)
    return (
      <div className={styles.resourceState} role="alert">
        <strong>Не удалось загрузить данные</strong>
        <p>{error}</p>
        <button className="button button-secondary" type="button" onClick={onRetry}>
          Повторить загрузку
        </button>
      </div>
    );
  if (loading)
    return (
      <div className={styles.loading} role="status">
        <LoaderCircle size={18} className={styles.spinner} /> Загружаем данные…
      </div>
    );
  if (empty)
    return (
      <div className={styles.resourceState}>
        <strong>Пока нет данных</strong>
        <p>{emptyText}</p>
      </div>
    );
  return null;
}
export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  const rows = Children.map(children, (row) => {
    if (!isValidElement<{ children?: ReactNode }>(row)) return row;
    return cloneElement(row, {
      children: Children.map(row.props.children, (cell, index) =>
        isValidElement<{ children?: ReactNode }>(cell)
          ? cloneElement(cell as ReactElement<{ "data-label"?: string; children?: ReactNode }>, {
              "data-label": headers[index],
              children: <div className={styles.cellValue}>{cell.props.children}</div>,
            })
          : cell,
      ),
    });
  });
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
export function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    const previous = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement) previous.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onKeyDownCapture={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          closeRef.current();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        closeRef.current();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
          onClose();
      }}
    >
      <header className={styles.dialogHead}>
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="icon-button" aria-label="Закрыть" onClick={onClose}>
          <X size={21} />
        </button>
      </header>
      <div className={styles.dialogBody}>{children}</div>
    </dialog>
  );
}
