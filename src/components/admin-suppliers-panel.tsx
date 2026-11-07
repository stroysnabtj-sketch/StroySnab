"use client";
import { useState } from "react";
import {
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  Select,
  Pagination,
  ResourceState,
  adminRequest,
  useAdminResource,
} from "@/components/admin-ui";
import { SHOP_STATUS_LABELS } from "@/modules/system/admin-labels";
type Supplier = {
  id: string;
  name: string;
  legalName: string | null;
  phone: string;
  email: string | null;
  status: string;
  offerCount: number;
  userCount: number;
};
const blank = { name: "", legalName: "", phone: "", email: "", status: "PENDING" };
export function AdminSuppliersPanel() {
  const resource = useAdminResource<{ items: Supplier[] }>("/api/admin/suppliers");
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [page, setPage] = useState(1),
    [open, setOpen] = useState(false),
    [editing, setEditing] = useState<Supplier | null>(null),
    [form, setForm] = useState(blank),
    [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [invite, setInvite] = useState(""),
    [owner, setOwner] = useState<Supplier | null>(null),
    [ownerEmail, setOwnerEmail] = useState("");
  const items = (resource.data?.items ?? []).filter(
    (item) =>
      (!filter || item.status === filter) &&
      (!q ||
        `${item.name} ${item.legalName ?? ""} ${item.phone} ${item.email ?? ""}`
          .toLocaleLowerCase("ru")
          .includes(q.toLocaleLowerCase("ru"))),
  );
  async function run(key: string, action: () => Promise<void>) {
    if (pending) return;
    setPending(key);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось выполнить действие");
    } finally {
      setPending("");
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    await run("save", async () => {
      await adminRequest(editing ? `/api/admin/suppliers/${editing.id}` : "/api/admin/suppliers", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          legalName: form.legalName || null,
          email: form.email || null,
        }),
      });
      setOpen(false);
      setMessage(editing ? "Данные магазина сохранены" : "Поставщик создан");
      await resource.reload();
    });
  }
  return (
    <>
      <div className="panel-toolbar">
        <div className="filters">
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            aria-label="Поиск магазинов"
            placeholder="Название, телефон или e-mail"
          />
          <Select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Статус магазина"
          >
            <option value="">Все статусы</option>
            {Object.entries(SHOP_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(blank);
            setError("");
            setOpen(true);
          }}
        >
          Добавить поставщика
        </Button>
      </div>
      {message && (
        <p className="form-success" role="status">
          {message}
        </p>
      )}
      {error && !open && !owner && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        empty={!items.length}
        onRetry={() => void resource.reload()}
        emptyText="Магазины по выбранным условиям не найдены."
      />
      <DataTable headers={["Магазин", "Контакты", "Предложения", "Команда", "Статус", "Действия"]}>
        {items.slice((page - 1) * 20, page * 20).map((item) => (
          <tr key={item.id}>
            <td>
              <strong>{item.name}</strong>
              <br />
              <span className="muted">{item.legalName}</span>
            </td>
            <td>
              {item.phone}
              <br />
              {item.email}
            </td>
            <td>{item.offerCount}</td>
            <td>{item.userCount}</td>
            <td>
              <Select
                value={item.status}
                disabled={!!pending}
                aria-label={`Статус ${item.name}`}
                onChange={(e) =>
                  void run(item.id, async () => {
                    await adminRequest(`/api/admin/suppliers/${item.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: e.target.value }),
                    });
                    setMessage("Статус магазина обновлён");
                    await resource.reload();
                  })
                }
              >
                {Object.entries(SHOP_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </td>
            <td>
              <div className="table-actions">
                <Button
                  variant="ghost"
                  disabled={!!pending}
                  onClick={() => {
                    setEditing(item);
                    setForm({ ...item, legalName: item.legalName ?? "", email: item.email ?? "" });
                    setError("");
                    setOpen(true);
                  }}
                >
                  Изменить
                </Button>
                <Button
                  variant="ghost"
                  disabled={!!pending}
                  onClick={() =>
                    void run(item.id, async () => {
                      const data = await adminRequest<{ url: string }>(
                        `/api/admin/suppliers/${item.id}/invitations`,
                        { method: "POST" },
                      );
                      setInvite(data.url);
                    })
                  }
                >
                  Пригласить
                </Button>
                <Button
                  variant="ghost"
                  disabled={!!pending}
                  onClick={() => {
                    setOwner(item);
                    setOwnerEmail("");
                    setError("");
                  }}
                >
                  Владелец
                </Button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
      <Pagination page={page} pages={Math.ceil(items.length / 20)} onPage={setPage} />
      <Modal
        open={open}
        title={editing ? "Изменить магазин" : "Новый поставщик"}
        onClose={() => !pending && setOpen(false)}
      >
        <form className="stack-form" onSubmit={save}>
          <Field label="Название магазина">
            <Input
              required
              minLength={2}
              maxLength={200}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Юридическое название">
            <Input
              value={form.legalName}
              maxLength={250}
              onChange={(e) => setForm({ ...form, legalName: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Телефон">
              <Input
                required
                type="tel"
                placeholder="+992"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Статус">
            <Select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              {Object.entries(SHOP_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p role="alert" className="form-alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending === "save"}>
            {editing ? "Сохранить изменения" : "Создать"}
          </Button>
        </form>
      </Modal>
      <Modal open={!!invite} title="Приглашение сотрудника" onClose={() => setInvite("")}>
        <div className="stack-form">
          <p>
            Ссылка действует 7 дней и используется один раз. Передайте её будущему сотруднику
            магазина.
          </p>
          <Field label="Ссылка приглашения">
            <Input readOnly value={invite} onFocus={(e) => e.target.select()} />
          </Field>
          <Button variant="secondary" onClick={() => setInvite("")}>
            Готово
          </Button>
        </div>
      </Modal>
      <Modal
        open={!!owner}
        title={`Владелец: ${owner?.name ?? ""}`}
        onClose={() => !pending && setOwner(null)}
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void run("owner", async () => {
              await adminRequest(`/api/admin/suppliers/${owner!.id}/owner`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: ownerEmail }),
              });
              setOwner(null);
              setMessage("Владелец назначен");
              await resource.reload();
            });
          }}
        >
          <p>
            Новый владелец получит управление магазином и командой. Предыдущий владелец останется
            сотрудником.
          </p>
          <Field label="E-mail существующего пользователя">
            <Input
              type="email"
              required
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
          </Field>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending === "owner"}>
            Назначить владельца
          </Button>
        </form>
      </Modal>
    </>
  );
}
