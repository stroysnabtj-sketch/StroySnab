import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { unstable_cache } from "next/cache";
import type { HomeContent } from "@/modules/merchandising/home-content";
import { getPublicProduct } from "@/modules/catalog/service";
import { ProductArt, getArtVariant } from "./product-art";

export async function HomeAdvertising({ ads }: { ads: HomeContent["ads"] }) {
  const placements = await unstable_cache(
    () =>
      Promise.all(
        ads
          .filter((ad) => ad.active)
          .map(async (ad) => {
            const detail = await getPublicProduct(ad.href.split("/").pop()!, false);
            if (!detail || !detail.offers.length) return null;
            return {
              ad,
              detail,
              image:
                ad.image ||
                (detail.images[0]
                  ? `/api/files/${detail.images[0].fileId}`
                  : ad.mobileImage || null),
            };
          }),
      ),
    ["home-advertising-v1", JSON.stringify(ads)],
    { revalidate: 30 },
  )();
  const visible = placements.filter((item) => item !== null);
  if (!visible.length) return null;
  return (
    <section className="shell home-advertising" aria-label="Предложения магазинов">
      {visible.map(({ ad, detail, image }) => (
        <Link href={ad.href} className="home-ad-card" key={ad.id}>
          <div className="home-ad-copy">
            <span className="home-ad-label">Реклама</span>
            <h2>{ad.title}</h2>
            <span className="home-ad-cta">
              {ad.buttonLabel}
              <ArrowRight size={18} />
            </span>
          </div>
          <div className="home-ad-image">
            {image ? (
              <picture>
                {ad.mobileImage && <source media="(max-width: 600px)" srcSet={ad.mobileImage} />}
                <Image src={image} alt="" fill sizes="(max-width:600px) 40vw, 260px" />
              </picture>
            ) : (
              <ProductArt variant={getArtVariant(detail.category.slug, detail.product.nameRu)} />
            )}
          </div>
        </Link>
      ))}
    </section>
  );
}
