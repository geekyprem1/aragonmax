"use client";

import { useEffect, useState } from "react";
import { LANDING_CONFIG } from "./config";

/** Sticky bottom buy bar that appears after scrolling. */
export default function StickyBuyBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t-4 border-yellow-400 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-xs font-semibold text-slate-700">
          ⚠️ <span className="text-red-600">{LANDING_CONFIG.productName}</span>{" "}
          — [PLACEHOLDER: urgency line, e.g. launch discount ends soon]
        </p>
        <a
          href={LANDING_CONFIG.checkoutUrl}
          className="rounded-full bg-gradient-to-b from-yellow-300 to-orange-500 px-6 py-2.5 text-sm font-black text-black shadow-md transition hover:brightness-105"
        >
          Get Instant Access — {LANDING_CONFIG.pricing.todayPrice}
        </a>
      </div>
    </div>
  );
}
