import Link from "next/link";
import DotMatrix, { GlyphOrb } from "@/components/ui/DotMatrix";
import { redirect } from "next/navigation";
import {
  MessageSquare,
  PenLine,
  Hammer,
  Code2,
  LayoutGrid,
  FileText,
  Layers,
  ImageIcon,
  GraduationCap,
  Building2,
  Users,
  Palette,
  Briefcase,
  Type,
  Video,
  Sparkles,
  Lock,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getEntitlements } from "@/lib/entitlements";
import { getUpgradeUrl } from "@/lib/settings";

interface Tool {
  href: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  unlocked: boolean;
}

export default async function DashboardPage() {
  const profile = await requireUser();
  if (!profile) redirect("/login");

  const ent = getEntitlements(profile);
  const upgradeUrl = (await getUpgradeUrl()) ?? profile.plan?.purchase_url ?? null;

  const supabase = await createClient();
  const { count: templateCount } = await supabase
    .from("templates")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .lte("tier", ent.template_level);

  const tools: Tool[] = [
    { href: "/chat", title: "AI Chat", desc: "Chat with ArgonMax K3 & more", icon: MessageSquare, unlocked: true },
    { href: "/writer", title: "AI Writer", desc: "Blogs, emails, copy", icon: PenLine, unlocked: true },
    { href: "/build", title: "Build", desc: "Websites, funnels, apps & games", icon: Hammer, unlocked: true },
    { href: "/code", title: "Code Generator", desc: "Generate code in any language", icon: Code2, unlocked: true },
    { href: "/templates", title: "Templates", desc: "Ready-made expert personas", icon: LayoutGrid, unlocked: true },
    { href: "/documents", title: "Chat with PDF", desc: "Ask questions about documents", icon: FileText, unlocked: ent.feature_pro },
    { href: "/bulk", title: "Bulk Generator", desc: "Generate in bulk, save hours", icon: Layers, unlocked: ent.feature_bulk },
    { href: "/studio", title: "Creative Studio", desc: "AI image & video", icon: ImageIcon, unlocked: ent.feature_media },
    { href: "/training", title: "Training", desc: "Traffic & growth resources", icon: GraduationCap, unlocked: ent.feature_traffic || ent.is_vip },
    { href: "/agency", title: "Agency", desc: "Manage client accounts", icon: Building2, unlocked: ent.is_agency },
    { href: "/team", title: "Team", desc: "Invite team members", icon: Users, unlocked: ent.seats > 1 },
    { href: "/branding", title: "Branding", desc: "Whitelabel your app", icon: Palette, unlocked: ent.is_whitelabel },
    { href: "/reseller", title: "Reseller", desc: "Sell & keep 100%", icon: Briefcase, unlocked: ent.is_reseller },
  ];
  const stats: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "Words remaining", value: ent.is_unlimited ? "Unlimited" : profile.words_remaining.toLocaleString(), icon: Type },
    { label: "Image credits", value: (profile.image_credits ?? 0).toLocaleString(), icon: ImageIcon },
    { label: "Video credits", value: (profile.video_credits ?? 0).toLocaleString(), icon: Video },
    { label: "Templates unlocked", value: (templateCount ?? 0).toLocaleString(), icon: Sparkles },
  ];

  return (
    <div className="os-dashboard mx-auto max-w-7xl px-5 py-7 sm:px-9 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><p className="os-eyebrow mb-2">Your workspace / Overview</p><h1 className="text-xl font-medium">Everything starts with an idea.</h1></div>
        <div className="flex items-center gap-3"><span className="os-plan"><span className="os-status-dot" />{profile.plan?.name || "Personal workspace"}</span>{upgradeUrl && <a href={upgradeUrl} target="_blank" rel="noopener noreferrer" className="os-upgrade">Upgrade <ArrowUpRight size={14} /></a>}</div>
      </div>

      <section className="os-dashboard-hero">
        <div className="relative z-10"><p className="os-eyebrow mb-6">Less friction. More possibility.</p><h2><DotMatrix text="YOUR WORKSPACE." className="os-dashboard-title" /></h2><p className="mt-5 max-w-md text-sm leading-relaxed opacity-60">Think it. Write it. Build it.<br />Your AI tools, together in one place.</p><Link href="/chat" className="os-hero-cta">Start a conversation <ArrowUpRight size={17} /></Link></div>
        <GlyphOrb className="os-dashboard-glyph" />
      </section>

      <div className="os-stats">
        {stats.map(({ label, value, icon: Icon }) => <div key={label} className="os-stat"><div className="flex items-center justify-between gap-2"><span className="os-eyebrow">{label}</span><Icon size={16} strokeWidth={1.5} className="text-muted" /></div><div className="os-stat-value">{value}<span className="os-stat-dot" /></div></div>)}
      </div>

      <div className="mb-4 flex items-center justify-between"><h2 className="os-eyebrow">Your toolkit</h2><span className="os-eyebrow">{tools.filter(t => t.unlocked).length} available tools</span></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tools.map(({ href, title, desc, icon: Icon, unlocked }) => unlocked ? (
          <Link key={href} href={href} className="os-tool-card group"><span className="os-tool-icon"><Icon size={21} strokeWidth={1.5} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium">{title}</h3><p className="mt-1.5 text-xs leading-relaxed text-muted">{desc}</p></div><ArrowUpRight size={16} className="self-start text-muted transition-colors group-hover:text-primary" /></Link>
        ) : (
          <div key={href} className="os-tool-card is-locked"><span className="os-tool-icon"><Lock size={17} strokeWidth={1.5} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-medium text-muted">{title}</h3><p className="mt-1.5 text-xs leading-relaxed text-muted">{desc}</p></div>{upgradeUrl && <a href={upgradeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Unlock</a>}</div>
        ))}
      </div>
      <p className="os-eyebrow mt-8 text-center">Made for a mind that never stands still.</p>
    </div>
  );
}
