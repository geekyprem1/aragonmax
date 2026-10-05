"use client";

import { useEffect, useState } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

/**
 * Urgency countdown. Placeholder: 6h rolling timer.
 * TODO: wire to a real campaign end date if needed.
 */
export default function CountdownTimer({ compact = false }: { compact?: boolean }) {
  const [secs, setSecs] = useState(6 * 3600);

  useEffect(() => {
    const id = setInterval(() => {
      setSecs((s) => (s <= 1 ? 6 * 3600 : s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const box = compact ? "px-2 py-1 text-sm" : "px-3 py-2 text-lg";

  return (
    <div className="flex items-center gap-2 font-mono" aria-label="Offer countdown">
      {[pad(h), pad(m), pad(s)].map((v, i) => (
        <span key={i} className="flex items-center gap-2">
          <span
            className={`rounded-lg border border-red-500/40 bg-red-500/15 text-red-200 tabular-nums ${box}`}
          >
            {v}
          </span>
          {i < 2 && <span className="text-red-300/70">:</span>}
        </span>
      ))}
    </div>
  );
}
