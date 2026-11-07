import Link from "next/link";
import { Workspace } from "@/components/workspace";
import { requirePageUser } from "@/modules/auth/page";
import { listShopProducts } from "@/modules/suppliers/shop-service";
import { formatTJS } from "@/modules/system/money";
import styles from "@/components/seller-workspace.module.css";
export const dynamic = "force-dynamic";
const statuses: Record<string, string> = {
  PENDING: "На модерации",
  PUBLISHED: "Опубликован",
  DRAFT: "Черновик",
  REJECTED: "Отклонён",
  ARCHIVED: "Архив",
};
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
}) {
  const actor = await requirePageUser(["SUPPLIER_OWNER", "SUPPLIER_STAFF"], "/seller/products");
  const q = ((await searchParams).q ?? "").trim();
  const requestedPage = Number((await searchParams).page ?? "1");
  const status = (await searchParams).status ?? "";
  const all = await listShopProducts(actor);
  const items = all.filter(
    (row) =>
      (!status || row.product.status === status) &&
      (!q ||
        `${row.product.nameRu} ${row.product.sku}`
          .toLocaleLowerCase("ru")
          .includes(q.toLocaleLowerCase("ru"))),
  );
  const pageSize = 24;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Number.isInteger(requestedPage)
    ? Math.min(pageCount, Math.max(1, requestedPage))
    : 1;
  const visible = items.slice((page - 1) * pageSize, page * pageSize);
  const pageHref = (n: number) =>
    `/seller/products?${new URLSearchParams({ ...(q ? { q } : {}), ...(status ? { status } : {}), page: String(n) })}`;
  return (
    <Workspace kind="seller">
      <div className={styles.root}>
        <div className={styles.heading}>
          <div>
            <h1>Товары магазина</h1>
            <p>
              {items.length} товаров{q ? " по запросу" : " в ассортименте"} · цены до наценки
              платформы
            </p>
          </div>
          <Link href="/seller/products/new" className={styles.button}>
            Добавить товар
          </Link>
        </div>
        <form className={styles.actions}>
          <label className={styles.field} style={{ flex: 1 }}>
            Поиск по названию или артикулу
            <input name="q" defaultValue={q} placeholder="Найти товар" />
          </label>
          <label className={styles.field}>
            Статус
            <select name="status" defaultValue={status}>
              <option value="">Все статусы</option>
              {Object.entries(statuses).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <button className={`${styles.button} ${styles.secondary}`} type="submit">
            Найти
          </button>
        </form>
        <section className={styles.panel}>
          {visible.length ? (
            <div className={styles.list}>
              {visible.map(({ product, offer }) => (
                <div key={product.id} className={styles.row}>
                  <div>
                    <Link className={styles.link} href={`/seller/products/${product.id}`}>
                      {product.nameRu}
                    </Link>
                    <small>{product.sku}</small>
                  </div>
                  <div>
                    <strong>
                      {offer ? formatTJS(offer.supplierPriceDirams) : "Без предложения"}
                    </strong>
                    <small>за {product.unit}</small>
                  </div>
                  <div>
                    <span className={styles.badge} data-status={product.status}>
                      {statuses[product.status] ?? product.status}
                    </span>
                    <small>
                      {offer?.isActive === "false"
                        ? "Продажа приостановлена"
                        : `Свободно: ${Math.max(0, Number(offer?.stockQty ?? 0) - Number(offer?.reservedQty ?? 0)).toLocaleString("ru")} ${product.unit}`}
                    </small>
                    {offer && Number(offer.reservedQty) > 0 && (
                      <small>
                        В резерве: {offer.reservedQty} {product.unit}
                      </small>
                    )}
                  </div>
                  <Link href={`/seller/products/${product.id}`} className={styles.link}>
                    Изменить
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              {q
                ? "По вашему запросу товаров нет."
                : "В ассортименте пока нет товаров. Добавьте первую карточку и отправьте её на проверку."}
            </div>
          )}
        </section>
        {pageCount > 1 && (
          <nav className={styles.actions} aria-label="Страницы товаров">
            <span>
              Страница {page} из {pageCount}
            </span>
            {page > 1 && (
              <Link className={`${styles.button} ${styles.secondary}`} href={pageHref(page - 1)}>
                Назад
              </Link>
            )}
            {page < pageCount && (
              <Link className={styles.button} href={pageHref(page + 1)}>
                Далее
              </Link>
            )}
          </nav>
        )}
      </div>
    </Workspace>
  );
}
