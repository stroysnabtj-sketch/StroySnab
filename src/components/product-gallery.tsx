"use client";
import Image from "next/image";
import { useState } from "react";
import { ProductArt } from "@/components/product-art";
export function ProductGallery({ images, name, sku, variant }: { images: { id: string; fileId: string }[]; name: string; sku: string; variant: "cement" | "rebar" | "brick" | "pipe" }) {
  const [selected, setSelected] = useState(0);
  return <div className="product-gallery">{images.length ? <Image key={images[selected]?.id} src={`/api/files/${images[selected]?.fileId}`} alt={`${name} — фото ${selected + 1}`} width={900} height={900} priority /> : <ProductArt variant={variant} />}<span className="mono">{sku}</span>{images.length > 1 && <div className="gallery-thumbs">{images.map((image, index) => <button key={image.id} className={selected === index ? "is-active" : ""} onClick={() => setSelected(index)} aria-label={`Фото ${index + 1}`} aria-pressed={selected === index}><Image src={`/api/files/${image.fileId}`} alt="" width={72} height={72} /></button>)}</div>}</div>;
}
