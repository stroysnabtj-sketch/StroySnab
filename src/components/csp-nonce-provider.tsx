"use client";
import { createContext, useContext } from "react";
const NonceContext = createContext<string | undefined>(undefined);
export const useCspNonce = () => useContext(NonceContext);
export function CspNonceProvider({
  nonce,
  children,
}: {
  nonce: string;
  children: React.ReactNode;
}) {
  return <NonceContext.Provider value={nonce}>{children}</NonceContext.Provider>;
}
