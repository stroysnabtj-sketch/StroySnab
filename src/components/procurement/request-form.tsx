"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Plus, X } from "lucide-react";
import { api } from "./shared";
import s from "./procurement.module.css";
import styles from "./request-form.module.css";

type Created = { id: string };
type RequestLine = { id: string; name: string; qty: string; unit: string };
const emptyLine = (id: string): RequestLine => ({ id, name: "", qty: "1", unit: "" });
export function ProcurementRequestForm({
  contactName = "",
  contactPhone = "",
  contactEmail = "",
  autoPreparation = false,
}: {
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  autoPreparation?: boolean;
}) {
  const router = useRouter();
  const [automatic, setAutomatic] = useState(false);
  const [mode, setMode] = useState<"file" | "manual">("file");
  const [lines, setLines] = useState<RequestLine[]>([emptyLine("first")]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submission = useRef<{ key: string; fingerprint: string } | null>(null);
  const contactsComplete = Boolean(contactName && contactPhone);
  const updateLine = (id: string, key: "name" | "qty" | "unit", value: string) =>
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, [key]: value } : line)),
    );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError("");
    setBusy(true);
    try {
      const requestLines =
        mode === "manual"
          ? lines
              .filter((line) => line.name.trim())
              .map(({ name, qty, unit }) => ({ name, qty: qty.replace(",", "."), unit }))
          : [];
      const requestFiles = mode === "file" ? files : [];
      if (!requestLines.length && !requestFiles.length)
        throw new Error(mode === "file" ? "Прикрепите список материалов" : "Добавьте материал");
      const payload = {
        contactName: form.get("contactName"),
        contactPhone: form.get("contactPhone"),
        contactEmail: form.get("contactEmail"),
        note: form.get("note"),
        lines: requestLines,
        autoPrepare: mode === "file" && automatic,
      };
      const fingerprint = JSON.stringify({
        ...payload,
        files: requestFiles.map((file) => ({
          name: file.name,
          size: file.size,
          lastModified: file.lastModified,
        })),
      });
      if (!submission.current || submission.current.fingerprint !== fingerprint)
        submission.current = { key: crypto.randomUUID(), fingerprint };
      const body = new FormData();
      body.set(
        "payload",
        JSON.stringify({
          ...payload,
          submissionKey: submission.current.key,
        }),
      );
      for (const file of requestFiles) body.append("files", file);
      const created = await api<Created>("/api/procurement/submit", { method: "POST", body });
      router.replace(`/requests/${created.id}`);
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className={styles.form} aria-busy={busy}>
      <fieldset disabled={busy} className={styles.fieldset}>
        <section className={s.card}>
          <div className={styles.modes} role="group" aria-label="Способ добавления списка">
            <button
              type="button"
              className={mode === "file" ? styles.active : ""}
              aria-pressed={mode === "file"}
              onClick={() => setMode("file")}
            >
              Прикрепить список
            </button>
            <button
              type="button"
              className={mode === "manual" ? styles.active : ""}
              aria-pressed={mode === "manual"}
              onClick={() => setMode("manual")}
            >
              Добавить материалы
            </button>
          </div>
          {mode === "file" ? (
            <div
              className={styles.filePanel}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const selected = Array.from(event.dataTransfer.files);
                if (
                  files.length + selected.length > 5 ||
                  selected.some((file) => file.size > 10 * 1024 * 1024 || file.size < 1)
                ) {
                  setError("До 5 файлов по 10 МБ");
                  return;
                }
                setFiles((current) => [...current, ...selected]);
                setError("");
              }}
            >
              <label className={styles.upload}>
                <FileUp size={24} aria-hidden="true" />
                <span>Загрузите список материалов</span>
                <small>Word, Excel, PDF или фото · до 5 файлов по 10 МБ</small>
                <input
                  aria-label="Список материалов"
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.csv,.xlsx,.docx"
                  onChange={(event) => {
                    const selected = Array.from(event.target.files ?? []);
                    event.target.value = "";
                    if (files.length + selected.length > 5) {
                      setError("Не более пяти вложений");
                      return;
                    }
                    if (selected.some((file) => file.size > 10 * 1024 * 1024 || file.size < 1)) {
                      setError("Каждый файл должен быть от 1 байта до 10 МБ");
                      return;
                    }
                    setError("");
                    setFiles((current) => [...current, ...selected]);
                  }}
                />
              </label>
              {autoPreparation && (
                <label className={styles.automatic}>
                  <input
                    type="checkbox"
                    checked={automatic}
                    onChange={(event) => setAutomatic(event.target.checked)}
                  />
                  <span>Подготовить расчёт автоматически</span>
                </label>
              )}
              {files.length > 0 && (
                <ul className={styles.fileList}>
                  {files.map((file, index) => (
                    <li key={`${file.name}-${index}`}>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Убрать файл ${file.name}`}
                        onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div>
              {lines.map((line, index) => (
                <div className={styles.line} key={line.id}>
                  <label className={s.field}>
                    Материал {index + 1}
                    <input
                      required
                      minLength={2}
                      maxLength={300}
                      value={line.name}
                      placeholder="Например, цемент М500"
                      onChange={(event) => updateLine(line.id, "name", event.target.value)}
                    />
                  </label>
                  <label className={s.field}>
                    Количество
                    <input
                      required
                      inputMode="decimal"
                      pattern="[0-9]+([.,][0-9]{1,3})?"
                      value={line.qty}
                      onChange={(event) => updateLine(line.id, "qty", event.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.remove}
                    disabled={lines.length === 1}
                    aria-label={`Удалить материал ${index + 1}`}
                    onClick={() =>
                      setLines((current) => current.filter((item) => item.id !== line.id))
                    }
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                  <details className={styles.unit}>
                    <summary>Единица измерения</summary>
                    <label className={s.field}>
                      Единица, если известна
                      <input
                        maxLength={30}
                        value={line.unit}
                        placeholder="м, меш., шт."
                        onChange={(event) => updateLine(line.id, "unit", event.target.value)}
                      />
                    </label>
                  </details>
                </div>
              ))}
              <button
                type="button"
                className="button button-secondary"
                disabled={lines.length >= 200}
                onClick={() => setLines((current) => [...current, emptyLine(crypto.randomUUID())])}
              >
                <Plus size={16} aria-hidden="true" /> Добавить материал
              </button>
            </div>
          )}
        </section>
        <section className={`${s.card} ${styles.contact}`}>
          {contactsComplete ? (
            <details>
              <summary>
                Контакты: {contactName}, {contactPhone} · изменить
              </summary>
              <div className={s.fields} style={{ marginTop: 16 }}>
                <ContactFields name={contactName} phone={contactPhone} />
              </div>
            </details>
          ) : (
            <div className={s.fields}>
              <ContactFields name={contactName} phone={contactPhone} />
            </div>
          )}
          <details
            className={styles.additional}
            open={mode === "file" && automatic ? true : undefined}
          >
            <summary>Комментарий и e-mail</summary>
            <div className={styles.extraFields}>
              <label className={s.field}>
                Комментарий
                <textarea name="note" maxLength={5000} />
              </label>
              <label className={s.field}>
                E-mail
                <input
                  type="email"
                  name="contactEmail"
                  defaultValue={contactEmail}
                  required={mode === "file" && automatic}
                  maxLength={254}
                  autoComplete="email"
                />
              </label>
            </div>
          </details>
        </section>
      </fieldset>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button type="submit" className={`button button-primary ${styles.submit}`} disabled={busy}>
        {busy
          ? "Загружаем список…"
          : mode === "file" && automatic
            ? "Подготовить КП"
            : "Отправить заявку"}
      </button>
    </form>
  );
}
function ContactFields({ name, phone }: { name: string; phone: string }) {
  return (
    <>
      <label className={s.field}>
        Имя
        <input
          name="contactName"
          required
          minLength={2}
          maxLength={120}
          defaultValue={name}
          autoComplete="name"
        />
      </label>
      <label className={s.field}>
        Телефон
        <input
          name="contactPhone"
          type="tel"
          required
          minLength={8}
          maxLength={30}
          defaultValue={phone}
          autoComplete="tel"
        />
      </label>
    </>
  );
}
