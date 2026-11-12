"use client";
import { Children, useId, useState, type ReactNode } from "react";

export function HomeCardGrid({ children, className }: { children: ReactNode; className: string }) {
  const [visible, setVisible] = useState(4);
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
          onClick={() => setVisible((count) => count + 4)}
        >
          Показать ещё
        </button>
      )}
    </>
  );
}
