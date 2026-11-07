import Image from "next/image";
import {
  placeholderPhoto,
  productPhotoKind,
  type ProductPhotoKind,
} from "@/modules/catalog/placeholder-images";
export type ArtVariant = ProductPhotoKind;
export const getArtVariant = productPhotoKind;
export function ProductArt({
  variant = "generic",
  className = "",
  large = false,
}: {
  variant?: ArtVariant;
  className?: string;
  large?: boolean;
}) {
  return (
    <Image
      src={placeholderPhoto(variant)}
      alt="Типовое изображение товарной группы"
      width={720}
      height={720}
      sizes={large ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 50vw, 30vw"}
      priority={large}
      className={`catalog-placeholder-photo ${className}`}
    />
  );
}
