"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUp, ArrowDown, Plus, X } from "lucide-react";
import { adminRequest, Button, Field, Input, Textarea } from "./admin-ui";
import { homeContentSchema, type HomeContent } from "@/modules/merchandising/home-content";
import styles from "./admin-home-collections-panel.module.css";

export function AdminHomeContentPanel() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);
  async function load() {
    setError("");
    try {
      setContent((await adminRequest<{ content: HomeContent }>("/api/admin/home-content")).content);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить главную");
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function edit(next: HomeContent) {
    setContent(next);
    setMessage("");
  }
  async function upload(file: File, apply: (url: string) => void) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.set("file", file);
      const data = await adminRequest<{ url: string }>("/api/admin/home-content/image", {
        method: "POST",
        body: form,
      });
      apply(data.url);
      setMessage("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить фото");
    } finally {
      setUploading(false);
    }
  }
  async function save() {
    const parsed = homeContentSchema.safeParse(content);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setPending(true);
    setError("");
    setMessage("");
    try {
      const data = await adminRequest<{ content: HomeContent }>("/api/admin/home-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      setContent(data.content);
      setMessage("Главная страница сохранена");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally {
      setPending(false);
    }
  }
  const busy = pending || uploading;
  function imageField(value: string, apply: (url: string) => void, label: string) {
    return (
      <div className={styles.imageField}>
        {value && (
          <div className={styles.preview}>
            <Image src={value} alt="" fill unoptimized sizes="300px" />
          </div>
        )}
        <Field label={label}>
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file, apply);
              event.target.value = "";
            }}
          />
        </Field>
      </div>
    );
  }
  return (
    <div className={styles.panel}>
      {error && (
        <div role="alert">
          {error}
          {!content && (
            <Button variant="secondary" onClick={() => void load()}>
              Повторить
            </Button>
          )}
        </div>
      )}
      {message && <p role="status">{message}</p>}
      {content ? (
        <fieldset className={styles.editor} disabled={busy}>
          <section className={styles.card} aria-labelledby="hero-editor-title">
            <h2 id="hero-editor-title">Первый блок</h2>
            {imageField(
              content.hero.image,
              (image) =>
                setContent((current) =>
                  current ? { ...current, hero: { ...current.hero, image } } : current,
                ),
              "Фото для компьютера · 1920 × 800",
            )}
            {imageField(
              content.hero.mobileImage,
              (mobileImage) =>
                setContent((current) =>
                  current ? { ...current, hero: { ...current.hero, mobileImage } } : current,
                ),
              "Фото для телефона · 780 × 1040 (необязательно)",
            )}
            {content.hero.mobileImage && (
              <Button
                variant="secondary"
                onClick={() => edit({ ...content, hero: { ...content.hero, mobileImage: "" } })}
              >
                Использовать основное фото на телефоне
              </Button>
            )}
            <Field label="Заголовок">
              <Textarea
                rows={3}
                maxLength={100}
                value={content.hero.title}
                onChange={(e) =>
                  edit({ ...content, hero: { ...content.hero, title: e.target.value } })
                }
              />
            </Field>
            <Field label="Текст">
              <Textarea
                rows={2}
                maxLength={200}
                value={content.hero.subtitle}
                onChange={(e) =>
                  edit({ ...content, hero: { ...content.hero, subtitle: e.target.value } })
                }
              />
            </Field>
            <div className={styles.formGrid}>
              {(["primary", "secondary"] as const).map((key, index) => (
                <div key={key}>
                  <Field label={`Кнопка ${index + 1}`}>
                    <Input
                      maxLength={35}
                      value={content.hero[`${key}Label`]}
                      onChange={(e) =>
                        edit({
                          ...content,
                          hero: { ...content.hero, [`${key}Label`]: e.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field label="Ссылка">
                    <Input
                      value={content.hero[`${key}Href`]}
                      onChange={(e) =>
                        edit({
                          ...content,
                          hero: { ...content.hero, [`${key}Href`]: e.target.value },
                        })
                      }
                    />
                  </Field>
                </div>
              ))}
            </div>
          </section>
          <section className={styles.card} aria-labelledby="ad-editor-title">
            <h2 id="ad-editor-title">Рекламные размещения · {content.ads.length}/6</h2>
            {content.ads.map((ad, index) => {
              function patch(values: Partial<typeof ad>) {
                if (content)
                  edit({
                    ...content,
                    ads: content.ads.map((row) => (row.id === ad.id ? { ...row, ...values } : row)),
                  });
              }
              function move(direction: number) {
                if (!content) return;
                const ads = [...content.ads];
                [ads[index], ads[index + direction]] = [ads[index + direction], ads[index]];
                edit({ ...content, ads });
              }
              return (
                <div className={styles.adEditor} key={ad.id}>
                  <div className={styles.row}>
                    <strong>Размещение {index + 1}</strong>
                    <div className={styles.actions}>
                      <Button
                        variant="secondary"
                        aria-label={`Поднять размещение ${index + 1}`}
                        disabled={index === 0 || busy}
                        onClick={() => move(-1)}
                      >
                        <ArrowUp size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`Опустить размещение ${index + 1}`}
                        disabled={index === content.ads.length - 1 || busy}
                        onClick={() => move(1)}
                      >
                        <ArrowDown size={16} />
                      </Button>
                      <Button
                        variant="secondary"
                        aria-label={`Удалить размещение ${index + 1}`}
                        onClick={() =>
                          edit({ ...content, ads: content.ads.filter((row) => row.id !== ad.id) })
                        }
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                  <Field label="Название">
                    <Input
                      value={ad.title}
                      maxLength={100}
                      onChange={(e) => patch({ title: e.target.value })}
                    />
                  </Field>
                  <Field label="Ссылка на товар">
                    <Input
                      placeholder="https://www.stroysnab.tj/product/…"
                      value={ad.href}
                      onChange={(e) => patch({ href: e.target.value })}
                    />
                  </Field>
                  <Field label="Текст кнопки">
                    <Input
                      value={ad.buttonLabel}
                      maxLength={35}
                      onChange={(e) => patch({ buttonLabel: e.target.value })}
                    />
                  </Field>
                  {imageField(
                    ad.image,
                    (image) =>
                      setContent((current) =>
                        current
                          ? {
                              ...current,
                              ads: current.ads.map((row) =>
                                row.id === ad.id ? { ...row, image } : row,
                              ),
                            }
                          : current,
                      ),
                    "Фото для компьютера · 800 × 600 (необязательно)",
                  )}
                  {imageField(
                    ad.mobileImage,
                    (mobileImage) =>
                      setContent((current) =>
                        current
                          ? {
                              ...current,
                              ads: current.ads.map((row) =>
                                row.id === ad.id ? { ...row, mobileImage } : row,
                              ),
                            }
                          : current,
                      ),
                    "Фото для телефона · 600 × 800 (необязательно)",
                  )}
                  {ad.mobileImage && (
                    <Button variant="secondary" onClick={() => patch({ mobileImage: "" })}>
                      Использовать основное фото на телефоне
                    </Button>
                  )}
                  {ad.image && (
                    <Button variant="secondary" onClick={() => patch({ image: "" })}>
                      Использовать фото товара
                    </Button>
                  )}
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={ad.active}
                      onChange={(e) => patch({ active: e.target.checked })}
                    />
                    Показывать на главной
                  </label>
                </div>
              );
            })}
            <Button
              variant="secondary"
              disabled={busy || content.ads.length >= 6}
              onClick={() =>
                edit({
                  ...content,
                  ads: [
                    ...content.ads,
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      href: "",
                      image: "",
                      mobileImage: "",
                      buttonLabel: "Смотреть товар",
                      active: true,
                    },
                  ],
                })
              }
            >
              <Plus size={17} />
              Добавить размещение
            </Button>
          </section>
          <Button onClick={() => void save()}>
            {uploading ? "Загружаем фото…" : pending ? "Сохраняем…" : "Сохранить главную"}
          </Button>
        </fieldset>
      ) : (
        !error && <p role="status">Загружаем главную…</p>
      )}
    </div>
  );
}
