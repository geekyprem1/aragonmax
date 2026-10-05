"use client";

import { useState } from "react";
import { FAQS } from "./config";

export default function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      {FAQS.map((f, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className="overflow-hidden rounded-xl border-2 border-slate-200 bg-white"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-bold text-slate-900">{f.q}</span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-slate-300 text-lg font-bold leading-none text-slate-500">
                {isOpen ? "−" : "+"}
              </span>
            </button>
            {isOpen && (
              <div className="border-t border-slate-200 px-5 py-4 text-sm leading-relaxed text-slate-600">
                {f.a}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
