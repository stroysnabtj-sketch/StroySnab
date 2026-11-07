"use client";
import { useState } from "react";
import styles from "./seller-workspace.module.css";
export function SellerInvitation() {
  const [busy,setBusy] = useState(false); const [url,setUrl] = useState(""); const [error,setError] = useState("");
  async function create() { setBusy(true); setError(""); try { const response = await fetch("/api/seller/team/invitations",{method:"POST"}); const data = await response.json(); if(!response.ok) throw new Error(data.error?.message ?? "Не удалось создать приглашение"); setUrl(new URL(`/supplier-invite?code=${encodeURIComponent(data.code)}`,window.location.origin).toString()); } catch(e) { setError(e instanceof Error ? e.message : "Не удалось связаться с сервером"); } finally { setBusy(false); } }
  return <section className={styles.panel}><h2>Пригласить сотрудника</h2><p className={styles.muted}>Ссылка действует 7 дней и используется один раз. Сотрудник получит доступ к товарам и заказам вашего магазина.</p><div className={styles.actions} style={{marginTop:16}}><button type="button" className={styles.button} disabled={busy} onClick={()=>void create()}>{busy ? "Создание…" : "Создать ссылку"}</button></div>{error && <p role="alert" className={`${styles.notice} ${styles.error}`}>{error}</p>}{url && <label className={styles.field} style={{marginTop:16}}>Ссылка для сотрудника<input readOnly value={url} onFocus={e=>e.target.select()}/><span className={styles.muted}>Скопируйте и передайте будущему сотруднику.</span></label>}</section>;
}
