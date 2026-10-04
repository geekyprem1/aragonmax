"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import BrandLogo from "@/components/layout/BrandLogo";
import Sidebar from "@/components/layout/Sidebar";
import type { Profile } from "@/types/db";

export default function Shell({
  profile,
  brandName,
  brandLogo,
  children,
}: {
  profile: Profile;
  brandName?: string | null;
  brandLogo?: string | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="os-shell flex h-dvh overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar profile={profile} brandName={brandName} brandLogo={brandLogo} />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform lg:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          profile={profile}
          brandName={brandName}
          brandLogo={brandLogo}
          onNavigate={() => setOpen(false)}
        />
      </div>

      {/* Main column */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b bg-surface px-4 py-3 lg:hidden">
          <button
            onClick={() => setOpen(true)}
            className="text-muted hover:text-foreground"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <BrandLogo brandName={brandName} brandLogo={brandLogo} compact />
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</main>
      </div>

      {/* Close button inside drawer (mobile) */}
      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed right-4 top-4 z-50 text-white lg:hidden"
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      )}
    </div>
  );
}
