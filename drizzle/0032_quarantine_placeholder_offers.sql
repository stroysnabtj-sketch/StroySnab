-- Disable the exact JCTOP bootstrap placeholders. Keep prices, reservations and history intact.
UPDATE supplier_offers AS o
SET is_active = 'false', updated_at = now()
FROM products AS p
WHERE o.product_id = p.id AND p.brand = 'JCTOP'
  AND o.supplier_price_dirams = 100 AND o.stock_qty = '100'
  AND o.min_order_qty = '1' AND o.lead_time_days = 1;
