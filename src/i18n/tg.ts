import type { MessageKey } from "./types";
import { ru } from "./ru";
import { storefrontTg } from "./storefront";
export const tg: Partial<Record<MessageKey, string>> = Object.fromEntries(
  Object.entries(ru)
    .filter(([, value]) => storefrontTg[value])
    .map(([key, value]) => [key, storefrontTg[value]]),
);
