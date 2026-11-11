import type { MetadataRoute } from "next";
import { publicSiteOrigin } from "@/modules/system/site-url";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/seller",
          "/account",
          "/api",
          "/auth/",
          "/cart",
          "/checkout",
          "/orders/",
        ],
      },
    ],
    sitemap: `${publicSiteOrigin()}/sitemap.xml`,
  };
}
