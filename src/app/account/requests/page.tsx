import Link from "next/link";
import { requirePageUser } from "@/modules/auth/page";
import { CustomerWorkspace } from "@/components/customer-workspace";
import { CustomerRequestList } from "@/components/customer-request-list";
import { customerRequestRows } from "./data";
import { CustomSelect } from "@/components/custom-select";
import styles from "@/components/account.module.css";
export const dynamic = "force-dynamic";
export const metadata = { title: "Мои заявки — Stroysnab.tj" };

export default async function AccountRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const user = await requirePageUser(["CUSTOMER"], "/account/requests");
  const params = await searchParams;
  const query = (params.q ?? "").slice(0, 200).trim();
  const status = ["active", "offered", "closed"].includes(params.status ?? "")
    ? params.status!
    : "";
  const rows = (await customerRequestRows(user)).filter(
    (item) =>
      (!status || item.group === status) &&
      (!query ||
        `${item.number} ${item.title}`
          .toLocaleLowerCase("ru")
          .includes(query.toLocaleLowerCase("ru"))),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 20));
  const requestedPage = Number(params.page);
  const page = Math.min(
    pages,
    Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const href = (nextPage: number) =>
    `/account/requests?${new URLSearchParams({ q: query, status, page: String(nextPage) })}`;
  return (
    <CustomerWorkspace
      title="Заявки"
      identity={user.phone}
      actions={
        <Link className="button button-primary" href="/request">
          Создать заявку
        </Link>
      }
    >
      <form className={styles.requestFilters} action="/account/requests">
        <label className="field">
          <span className="field-label">Поиск</span>
          <input
            className="input"
            name="q"
            defaultValue={query}
            maxLength={200}
            placeholder="Номер или материал"
          />
        </label>
        <label className="field">
          <span className="field-label">Статус</span>
          <CustomSelect name="status" defaultValue={status} aria-label="Статус">
            <option value="">Все</option>
            <option value="active">В работе</option>
            <option value="offered">Есть предложение</option>
            <option value="closed">Завершены</option>
          </CustomSelect>
        </label>
        <button className="button button-secondary">Найти</button>
      </form>
      <p className={styles.resultCount}>Найдено: {rows.length}</p>
      <CustomerRequestList items={rows.slice((page - 1) * 20, page * 20)} />
      {pages > 1 && (
        <nav className={styles.pagination} aria-label="Страницы заявок">
          {page > 1 && (
            <Link className="button button-secondary" href={href(page - 1)}>
              Назад
            </Link>
          )}
          <span>
            {page} / {pages}
          </span>
          {page < pages && (
            <Link className="button button-secondary" href={href(page + 1)}>
              Далее
            </Link>
          )}
        </nav>
      )}
    </CustomerWorkspace>
  );
}
