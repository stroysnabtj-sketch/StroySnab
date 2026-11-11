import { expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { registerCustomer } from "@/modules/auth/service";
import { saveAddress, listAddresses, deleteAddress } from "@/modules/account/addresses";
it("stores map points with addresses and keeps ownership and default selection", async () => {
  const suffix = Date.now().toString().slice(-7);
  const a = await registerCustomer(
    { fullName: "Адрес А", phone: `93${suffix}`, password: "Address123!", termsAccepted: true },
    "test",
  );
  const b = await registerCustomer(
    { fullName: "Адрес Б", phone: `92${suffix}`, password: "Address123!", termsAccepted: true },
    "test",
  );
  const db = await getDb();
  try {
    await expect(saveAddress(a.id, { label: "Объект" })).rejects.toThrow();
    await expect(saveAddress(a.id, { label: "Объект", lat: 38.57 })).rejects.toThrow();
    await expect(
      saveAddress(a.id, {
        label: "Объект",
        city: "Душанбе",
        street: "Рудаки 10",
        lat: 999,
        lng: 68,
      }),
    ).rejects.toThrow();
    const saved = await saveAddress(a.id, {
      label: "Дом",
      city: "Душанбе",
      street: "Рудаки 10",
      lat: 38.57,
      lng: 68.78,
    });
    expect((await listAddresses(a.id))[0]).toMatchObject({
      id: saved.id,
      lat: 38.57,
      lng: 68.78,
      isDefault: true,
    });
    expect(await listAddresses(b.id)).toHaveLength(0);
    await expect(
      saveAddress(b.id, {
        id: saved.id,
        label: "Чужой",
        city: "Душанбе",
        street: "Рудаки 10",
        lat: 38.57,
        lng: 68.78,
      }),
    ).rejects.toMatchObject({ status: 404 });
    await expect(deleteAddress(b.id, saved.id)).rejects.toMatchObject({ status: 404 });
    const second = await saveAddress(a.id, {
      label: "Объект",
      city: "Душанбе",
      street: "Сомони 20",
      isDefault: true,
    });
    expect((await listAddresses(a.id)).find((v) => v.id === second.id)).toMatchObject({
      lat: null,
      lng: null,
      street: "Сомони 20",
    });
    expect((await listAddresses(a.id)).filter((v) => v.isDefault).map((v) => v.id)).toEqual([
      second.id,
    ]);
    await deleteAddress(a.id, second.id);
    expect((await listAddresses(a.id))[0].isDefault).toBe(true);
    const mapOnly = await saveAddress(a.id, { label: "Точка", lat: 38.58, lng: 68.79 });
    expect((await listAddresses(a.id)).find((v) => v.id === mapOnly.id)).toMatchObject({
      city: "",
      street: "",
      lat: 38.58,
      lng: 68.79,
    });
  } finally {
    await db.delete(users).where(eq(users.id, a.id));
    await db.delete(users).where(eq(users.id, b.id));
  }
});
