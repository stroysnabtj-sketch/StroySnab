"use client";
import { useState } from "react";
import {
  Badge,
  Button,
  DataTable,
  Field,
  Input,
  Modal,
  Select,
  ResourceState,
  Pagination,
  adminRequest,
  useAdminResource,
} from "@/components/admin-ui";
import { ROLES, type Role } from "@/modules/rbac/permissions";
import { ROLE_LABELS } from "@/modules/system/admin-labels";
import { formatDate } from "@/i18n";
type User = {
  id: string;
  phone: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  status: string;
  createdAt: string;
};
const blank = { fullName: "", phone: "", email: "", password: "", role: "SALES_MANAGER" };
export function AdminUsersPanel({
  actorId,
  canManageAdmins = false,
}: {
  actorId: string;
  canManageAdmins?: boolean;
}) {
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [role, setRole] = useState(""),
    [status, setStatus] = useState(""),
    [open, setOpen] = useState(false),
    [pending, setPending] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState(blank),
    [block, setBlock] = useState<User | null>(null);
  const resource = useAdminResource<{ items: User[]; total: number }>(
    `/api/admin/users?${new URLSearchParams({ q, role, status, page: String(page) })}`,
  );
  const items = resource.data?.items ?? [];
  const staffRoles = ROLES.filter(
    (value) =>
      !["GUEST", "CUSTOMER", "SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(value) &&
      (canManageAdmins || !["ADMIN", "SUPER_ADMIN"].includes(value)),
  );
  const editableRoles = ROLES.filter(
    (value) =>
      !["GUEST", "SUPPLIER_OWNER", "SUPPLIER_STAFF"].includes(value) &&
      (canManageAdmins || !["ADMIN", "SUPER_ADMIN"].includes(value)),
  );
  async function patch(id: string, data: { role?: string; status?: string }) {
    if (pending) return;
    setPending(id);
    setError("");
    setMessage("");
    try {
      await adminRequest(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setMessage("Изменения сохранены");
      setBlock(null);
      await resource.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить изменения");
    } finally {
      setPending("");
    }
  }
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending("create");
    setError("");
    try {
      await adminRequest("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setOpen(false);
      setForm(blank);
      setMessage("Сотрудник создан");
      await resource.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать сотрудника");
    } finally {
      setPending("");
    }
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
            placeholder="Телефон, e-mail или имя"
            aria-label="Поиск пользователей"
          />
          <Select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            aria-label="Фильтр по роли"
          >
            <option value="">Все роли</option>
            {ROLES.filter((value) => value !== "GUEST").map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </Select>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            aria-label="Фильтр по статусу"
          >
            <option value="">Все статусы</option>
            <option value="ACTIVE">Активен</option>
            <option value="BLOCKED">Заблокирован</option>
          </Select>
        </div>
        <Button
          onClick={() => {
            setForm(blank);
            setError("");
            setOpen(true);
          }}
        >
          Создать сотрудника
        </Button>
      </div>
      {message && (
        <p role="status" className="form-success">
          {message}
        </p>
      )}
      {error && !open && !block && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <ResourceState
        loading={resource.loading}
        error={resource.error}
        empty={!items.length}
        onRetry={() => void resource.reload()}
      />
      <DataTable headers={["Пользователь", "Контакты", "Роль", "Статус", "Создан", "Действия"]}>
        {items.map((user) => {
          const protectedUser = !canManageAdmins && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
          const shopUser = user.role.startsWith("SUPPLIER_");
          return (
            <tr key={user.id}>
              <td>
                <strong>{user.fullName ?? user.email ?? "Имя не указано"}</strong>
                {user.id === actorId && <small className="muted"> · Вы</small>}
              </td>
              <td>
                {user.phone}
                <br />
                <span className="muted">{user.email}</span>
              </td>
              <td>
                {protectedUser || shopUser ? (
                  <span>{ROLE_LABELS[user.role]}</span>
                ) : (
                  <Select
                    value={user.role}
                    disabled={!!pending}
                    aria-label={`Роль ${user.phone}`}
                    onChange={(e) => void patch(user.id, { role: e.target.value })}
                  >
                    {editableRoles.map((value) => (
                      <option key={value} value={value}>
                        {ROLE_LABELS[value]}
                      </option>
                    ))}
                  </Select>
                )}
              </td>
              <td>
                <Badge tone={user.status === "ACTIVE" ? "success" : "danger"}>
                  {user.status === "ACTIVE" ? "Активен" : "Заблокирован"}
                </Badge>
              </td>
              <td>{formatDate(user.createdAt)}</td>
              <td>
                <Button
                  variant="ghost"
                  disabled={!!pending || protectedUser || user.id === actorId}
                  onClick={() => {
                    setError("");
                    if (user.status === "ACTIVE") setBlock(user);
                    else void patch(user.id, { status: "ACTIVE" });
                  }}
                >
                  {user.status === "ACTIVE" ? "Заблокировать" : "Разблокировать"}
                </Button>
              </td>
            </tr>
          );
        })}
      </DataTable>
      <Pagination
        page={page}
        pages={Math.ceil((resource.data?.total ?? 0) / 24)}
        onPage={setPage}
      />
      <Modal open={open} title="Создать сотрудника" onClose={() => !pending && setOpen(false)}>
        <form className="stack-form" onSubmit={create}>
          <Field label="Имя и фамилия">
            <Input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label="Телефон">
              <Input
                required
                type="tel"
                placeholder="+992"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="E-mail">
              <Input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
          </div>
          <Field
            label="Временный пароль"
            hint="Не менее 8 символов. Передайте пароль сотруднику лично."
          >
            <Input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Field label="Роль">
            <Select
              aria-label="Роль"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {staffRoles.map((value) => (
                <option key={value} value={value}>
                  {ROLE_LABELS[value]}
                </option>
              ))}
            </Select>
          </Field>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={pending === "create"}>
            Создать сотрудника
          </Button>
        </form>
      </Modal>
      <Modal
        open={!!block}
        title="Заблокировать пользователя?"
        onClose={() => !pending && setBlock(null)}
      >
        <div className="stack-form">
          <p>
            Доступ пользователя {block?.fullName ?? block?.phone} будет закрыт, активные сессии
            завершатся.
          </p>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <Button
            variant="danger"
            loading={!!pending}
            onClick={() => block && void patch(block.id, { status: "BLOCKED" })}
          >
            Подтвердить блокировку
          </Button>
          <Button variant="secondary" disabled={!!pending} onClick={() => setBlock(null)}>
            Отмена
          </Button>
        </div>
      </Modal>
    </>
  );
}
