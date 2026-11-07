import {
  jsonb,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { customers } from "./auth";
import { products, supplierOffers } from "./catalog";
import { suppliers } from "./suppliers";

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderNumber: text("order_number").notNull().unique(),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    guestAccessTokenHash: text("guest_access_token_hash"),
    idempotencyKey: text("idempotency_key").unique(),
    goodsBaseDirams: text("goods_base_dirams"),
    markupPercent: integer("markup_percent"),
    markupDirams: text("markup_dirams"),
    customerPhone: text("customer_phone").notNull(),
    customerName: text("customer_name").notNull(),
    deliveryCity: text("delivery_city").notNull().default("Кушониён"),
    deliveryAddress: text("delivery_address").notNull(),
    deliveryLat: numeric("delivery_lat", { precision: 9, scale: 6 }),
    deliveryLng: numeric("delivery_lng", { precision: 9, scale: 6 }),
    deliveryNotes: text("delivery_notes"),
    vehicleType: text("vehicle_type").notNull().default("GAZELLE"),
    unloadingType: text("unloading_type").notNull().default("SELF"),
    preferredDeliveryDate: text("preferred_delivery_date"),
    preferredTimeSlot: text("preferred_time_slot"),
    status: text("status").notNull().default("CONFIRMED"), // NEW, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED
    paymentMethod: text("payment_method").notNull().default("CASH_ON_DELIVERY"),
    materialsTotalDirams: text("materials_total_dirams").notNull().default("0"),
    deliveryTotalDirams: text("delivery_total_dirams").notNull().default("0"),
    totalDirams: text("total_dirams").notNull().default("0"),
    estimatedWeightKg: numeric("estimated_weight_kg", { precision: 10, scale: 2 }),
    estimatedVolumeM3: numeric("estimated_volume_m3", { precision: 8, scale: 2 }),
    driverName: text("driver_name"),
    driverPhone: text("driver_phone"),
    vehiclePlate: text("vehicle_plate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("orders_customer_idx").on(table.customerId),
    index("orders_status_idx").on(table.status),
    index("orders_created_idx").on(table.createdAt),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    offerId: uuid("offer_id").references(() => supplierOffers.id, { onDelete: "set null" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
    supplierName: text("supplier_name"),
    supplierPriceDirams: text("supplier_price_dirams"),
    supplierSubtotalDirams: text("supplier_subtotal_dirams"),
    shopStatus: text("shop_status").notNull().default("NEW"),
    shopUpdatedAt: timestamp("shop_updated_at", { withTimezone: true }).notNull().defaultNow(),
    imageIds: jsonb("image_ids").$type<string[]>().notNull().default([]),
    productName: text("product_name").notNull(),
    sku: text("sku").notNull(),
    unit: text("unit").notNull().default("шт."),
    qty: numeric("qty", { precision: 14, scale: 3 }).notNull(),
    priceDirams: text("price_dirams").notNull(),
    subtotalDirams: text("subtotal_dirams").notNull(),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_supplier_order_idx").on(table.supplierId, table.orderId),
  ],
);
