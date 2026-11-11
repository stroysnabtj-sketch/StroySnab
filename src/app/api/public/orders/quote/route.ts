import { assertSameOrigin } from "@/server/security";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { currentUserId } from "@/modules/cart/service";
import { quoteOrder } from "@/modules/orders/service";
import { parseJsonBody } from "@/server/validation";
import { errorResponse } from "@/server/api-error";
export async function POST(req: Request) {
  try {
    assertSameOrigin(req);
    const body = z
      .object({ fulfillment: z.enum(["DELIVERY", "PICKUP"]) })
      .parse(await parseJsonBody(req));
    const quote = await quoteOrder({
      ...body,
      userId: await currentUserId(),
      guestToken: (await cookies()).get("kh_cart")?.value,
    });
    return NextResponse.json({
      materialsTotalDirams: quote.materialsTotalDirams,
      deliveryTotalDirams: quote.deliveryTotalDirams,
      totalDirams: quote.totalDirams,
      items: quote.items.map((item) => ({
        offerId: item.offerId,
        productName: item.productName,
        sku: item.sku,
        unit: item.unit,
        qty: item.qty,
        priceDirams: item.priceDirams,
        subtotalDirams: item.subtotalDirams,
      })),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
