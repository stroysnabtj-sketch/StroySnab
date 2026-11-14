"use client";
import { useLocale } from "@/i18n/provider";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { countNoun } from "@/modules/system/plural";
import { categoryPhoto } from "@/modules/catalog/placeholder-images";
export function CategoryTile({
  slug,
  name,
  childCount,
  description,
  actionText,
}: {
  slug: string;
  name: string;
  childCount?: number;
  description?: string;
  actionText?: string;
}) {
  const { tr, locale } = useLocale();
  return (
    <Link
      href={`/catalog?category=${encodeURIComponent(slug)}`}
      className="category-tile-card category-photo-card"
    >
      <span className="category-tile-media">
        <Image
          src={categoryPhoto(slug, name)}
          alt=""
          fill
          sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw"
          className="category-tile-photo"
        />
      </span>
      <span className="category-tile-content">
        <h3 className="category-tile-title">{tr(name)}</h3>
        {description && <span className="category-tile-desc">{description}</span>}
        <span className="category-tile-count">
          {childCount
            ? locale === "tg"
              ? `${childCount} бахш`
              : countNoun(childCount, "раздел", "раздела", "разделов")
            : (actionText ?? tr("Смотреть товары"))}
        </span>
      </span>
      <ArrowUpRight className="category-tile-arrow" size={18} />
    </Link>
  );
}
