import { optionalUser, requireUser } from "@/modules/auth/session";
import { saveQuotation, decideQuotation } from "@/modules/procurement/service";
import { assertSameOrigin } from "@/server/security";
import { errorResponse } from "@/server/api-error";
import { jsonResponse } from "@/server/json";
type Context = { params: Promise<{ id: string }> };
export async function PUT(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    return jsonResponse(
      await saveQuotation(
        (await params).id,
        await requireUser("product_requests:manage"),
        await request.json(),
      ),
    );
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    assertSameOrigin(request);
    const token=request.headers.get("x-request-access");
    const result=await decideQuotation(
        (await params).id,
        await optionalUser(),
        token,
        await request.json(),
      );
    const response=jsonResponse(result);
    if(result.orderId&&token)response.cookies.set(`kh_order_${result.orderId}`,token,{httpOnly:true,sameSite:'lax',secure:new URL(request.url).protocol==='https:',path:'/',maxAge:30*86400});
    return response;
  } catch (e) {
    return errorResponse(e);
  }
}
