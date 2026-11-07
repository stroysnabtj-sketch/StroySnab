"use client";
import Image from "next/image";
import { useState } from "react";
import { api } from "./shared";
import s from "./procurement.module.css";
export function LinePhotos({
  requestId,
  images,
  onChange,
  onBusy,
  onError,
  disabled,
}: {
  requestId: string;
  images: string[];
  onChange: (images: string[]) => void;
  onBusy?: (busy: boolean) => void;
  onError?: (error: string) => void;
  disabled: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  async function upload(file: File) {
    setUploading(true);
    onBusy?.(true);
    onError?.("");
    try {
      const form = new FormData();
      form.set("file", file);
      const image = await api<{ id: string }>(`/api/procurement/${requestId}/images`, {
        method: "POST",
        body: form,
      });
      onChange([...images, image.id]);
    } catch (e) {
      onError?.((e as Error).message);
    } finally {
      setUploading(false);
      onBusy?.(false);
    }
  }
  return (
    <div className={s.linePhotos}>
      {images.map((id) => (
        <span key={id} className={s.photo}>
          <a
            href={`/api/procurement/${requestId}/images/${id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src={`/api/procurement/${requestId}/images/${id}`}
              alt="Фото материала"
              width={60}
              height={60}
              unoptimized
            />
          </a>
          <button
            type="button"
            disabled={disabled}
            aria-label="Удалить фото"
            onClick={() => onChange(images.filter((value) => value !== id))}
          >
            ×
          </button>
        </span>
      ))}
      {images.length < 3 && (
        <label className={s.uploadPhoto}>
          {uploading ? "Загружаем…" : "+ Фото"}
          <input
            type="file"
            aria-label="Добавить фото материала"
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
    </div>
  );
}
