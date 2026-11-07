"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Modal, adminRequest } from "./admin-ui";
export function DeliveryAssignment({
  order,
}: {
  order: {
    id: string;
    orderNumber: string;
    driverName: string | null;
    driverPhone: string | null;
    vehiclePlate: string | null;
    updatedAt: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [form, setForm] = useState({ driverName: "", driverPhone: "", vehiclePlate: "" });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await adminRequest(`/api/admin/orders/${order.id}/delivery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, expectedUpdatedAt: order.updatedAt }),
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить назначение");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setForm({
            driverName: order.driverName ?? "",
            driverPhone: order.driverPhone ?? "",
            vehiclePlate: order.vehiclePlate ?? "",
          });
          setError("");
          setOpen(true);
        }}
      >
        {order.driverName ? "Изменить водителя" : "Назначить водителя"}
      </Button>
      <Modal
        open={open}
        title={`Водитель · ${order.orderNumber}`}
        onClose={() => !busy && setOpen(false)}
      >
        <form className="stack-form" onSubmit={save}>
          <p>
            Укажите согласованные контакты водителя и госномер машины. Данные будут доступны
            покупателю в его заказе.
          </p>
          <Field label="Имя водителя">
            <Input
              required
              minLength={2}
              maxLength={120}
              value={form.driverName}
              onChange={(e) => setForm({ ...form, driverName: e.target.value })}
            />
          </Field>
          <Field label="Телефон водителя">
            <Input
              required
              type="tel"
              placeholder="+992"
              value={form.driverPhone}
              onChange={(e) => setForm({ ...form, driverPhone: e.target.value })}
            />
          </Field>
          <Field label="Госномер машины">
            <Input
              required
              minLength={3}
              maxLength={30}
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
            />
          </Field>
          {error && (
            <p className="form-alert" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy}>
            Сохранить назначение
          </Button>
        </form>
      </Modal>
    </>
  );
}
