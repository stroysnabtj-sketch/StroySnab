"use client";

import { useEffect, useState, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function ProgressIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [animating, setAnimating] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    setWidth(30);
    setAnimating(true);
    const t1 = setTimeout(() => setWidth(80), 70);
    const t2 = setTimeout(() => setWidth(100), 200);
    const t3 = setTimeout(() => {
      setAnimating(false);
      setWidth(0);
    }, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [pathname, searchParams]);

  if (!animating && width === 0) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "2.5px",
        zIndex: 99999,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          background: "linear-gradient(90deg, #3278d0, #074089)",
          boxShadow: "0 0 10px rgba(50, 120, 208, 0.7)",
          transition: width === 100 ? "width 120ms ease-out, opacity 180ms ease-out 80ms" : "width 200ms ease-out",
          opacity: width === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <ProgressIndicator />
    </Suspense>
  );
}

