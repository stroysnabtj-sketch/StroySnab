import { sql } from "drizzle-orm";
export const visibleCategoryIds = sql`with recursive visible_categories as (
  select c.id from categories c where c.parent_id is null and c.is_active = 'true'
  union
  select c.id from categories c join visible_categories parent on parent.id = c.parent_id where c.is_active = 'true'
) select id from visible_categories`;
