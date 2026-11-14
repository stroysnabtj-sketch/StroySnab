"use client";
import { useLocale } from "@/i18n/provider";
import { Children, useEffect, useId, useState, type ReactNode } from "react";

export function HomeCardGrid({ children, className }: { children: ReactNode; className: string }) {
  const { tr } = useLocale();
  const [visible, setVisible] = useState(4);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const id = useId();
  const cards = Children.toArray(children);
  return (
    <>
      <div id={id} className={`${className} home-expandable-grid`}>
        {cards.map((card, index) => (
          <div className={index >= visible ? "home-card-deferred" : ""} key={index}>
            {card}
          </div>
        ))}
      </div>
      {visible < cards.length && (
        <button
          type="button"
          className="button button-secondary home-show-more"
          aria-controls={id}
          disabled={!ready}
          onClick={() => setVisible((count) => count + 4)}
        >
          {tr("Показать ещё")}
        </button>
      )}
    </>
  );
}
