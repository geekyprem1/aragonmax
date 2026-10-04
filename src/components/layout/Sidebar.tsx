"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  PenLine,
  Hammer,
  Code2,
  LayoutGrid,
  FileText,
  Layers,
  ImageIcon,
  GraduationCap,
  Briefcase,
  Palette,
  Building2,
  Users,
  CreditCard,
  BookOpen,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getEntitlements } from "@/lib/entitlements";
import BrandLogo from "@/components/layout/BrandLogo";
import ThemeToggle from "@/components/layout/ThemeToggle";
import type { Profile } from "@/types/db";

const userNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "AI Chat", icon: MessageSquare },
  { href: "/writer", label: "AI Writer", icon: PenLine },
  { href: "/build", label: "Build", icon: Hammer },
  { href: "/code", label: "Code Generator", icon: Code2 },
  { href: "/templates", label: "Templates", icon: LayoutGrid },
];

const adminNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
  { href: "/admin/templates", label: "Templates", icon: LayoutGrid },
  { href: "/admin/resources", label: "Resources", icon: BookOpen },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLink({
    href,
    label,
    icon: Icon,
    onNavigate,
  }: {
    href: string;
    label: string;
    icon: LucideIcon;
    onNavigate?: () => void;
  }) {
    const pathname = usePathname();
    const active = pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
    return (
      <Link
        href={href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`os-nav-link group ${active ? "is-active" : ""}`}
      >
        <Icon size={17} strokeWidth={1.6} />
        {label}
      </Link>
    );
}

export default function Sidebar({
  profile,
  brandName,
  brandLogo,
  onNavigate,
}: {
  profile: Profile;
  brandName?: string | null;
  brandLogo?: string | null;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const ent = getEntitlements(profile);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }



  return (
    <aside className="os-sidebar">
      <Link href="/dashboard" onClick={onNavigate} className="os-brand">
        <BrandLogo brandName={brandName} brandLogo={brandLogo} />
      </Link>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-thin">
        <p className="px-3 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.16em] font-mono text-muted">
          Workspace
        </p>
        {userNav.map((item) => (
          <NavLink onNavigate={onNavigate} key={item.href} {...item} />
        ))}
        {ent.feature_pro && (
          <NavLink onNavigate={onNavigate} href="/documents" label="Chat with PDF" icon={FileText} />
        )}
        {ent.feature_bulk && (
          <NavLink onNavigate={onNavigate} href="/bulk" label="Bulk Generator" icon={Layers} />
        )}
        {ent.feature_media && (
          <NavLink onNavigate={onNavigate} href="/studio" label="Creative Studio" icon={ImageIcon} />
        )}
        {(ent.feature_traffic || ent.is_vip) && (
          <NavLink onNavigate={onNavigate} href="/training" label="Training" icon={GraduationCap} />
        )}
        {ent.is_whitelabel && (
          <NavLink onNavigate={onNavigate} href="/branding" label="Branding" icon={Palette} />
        )}
        {ent.is_agency && (
          <NavLink onNavigate={onNavigate} href="/agency" label="Agency" icon={Building2} />
        )}
        {ent.seats > 1 && <NavLink onNavigate={onNavigate} href="/team" label="Team" icon={Users} />}
        {ent.is_reseller && (
          <NavLink onNavigate={onNavigate} href="/reseller" label="Reseller" icon={Briefcase} />
        )}

        {profile.role === "admin" && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-[0.16em] font-mono text-muted">
              Admin
            </p>
            {adminNav.map((item) => (
              <NavLink onNavigate={onNavigate} key={item.href} {...item} />
            ))}
          </>
        )}
      </nav>

      <div className="space-y-2 border-t p-3">
        <div className="os-account">
          <span className="os-avatar">{profile.email.slice(0, 1).toUpperCase()}</span>
          <div className="min-w-0"><div className="truncate text-xs">{profile.email}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-muted">{profile.plan?.name || (profile.role === "admin" ? "Administrator" : "Personal account")}</div></div>
        </div>
        <ThemeToggle />
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </aside>
  );
}
