export type Role = "admin" | "user";
export type UserStatus = "active" | "disabled";
export type TemplateCategory = "expert" | "writing" | "coding";
export type AiModule = "chat" | "writer" | "code";

export interface Entitlements {
  is_unlimited: boolean;
  template_level: number; // 0 free · 1 bump · 2 premium (DFY)
  feature_pro: boolean;
  feature_bulk: boolean;
  feature_traffic: boolean;
  feature_media: boolean; // Creative Studio (image + video)
  is_agency: boolean;
  agency_accounts: number;
  seats: number;
  is_whitelabel: boolean;
  is_reseller: boolean;
  is_vip: boolean;
}

export const ENTITLEMENT_DEFAULTS: Entitlements = {
  is_unlimited: false,
  template_level: 0,
  feature_pro: false,
  feature_bulk: false,
  feature_traffic: false,
  feature_media: false,
  is_agency: false,
  agency_accounts: 0,
  seats: 1,
  is_whitelabel: false,
  is_reseller: false,
  is_vip: false,
};

export interface Plan extends Entitlements {
  id: string;
  name: string;
  monthly_words: number;
  price: number | null;
  purchase_url: string | null;
  is_active: boolean;
  image_credits: number;
  video_credits: number;
  created_at: string;
}

export interface Profile extends Entitlements {
  id: string;
  email: string;
  role: Role;
  plan_id: string | null;
  words_remaining: number;
  status: UserStatus;
  created_at: string;
  parent_id: string | null;
  is_sub_admin: boolean;
  member_type: "agency" | "team" | null;
  image_credits: number;
  video_credits: number;
  plan?: Plan | null;
}

export interface AiModel {
  id: string;
  model_key: string;
  display_name: string;
  is_default: boolean;
  is_active: boolean;
  badge: string | null;
  sort_order: number;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  icon: string | null;
  system_prompt: string;
  is_active: boolean;
  tier: number; // 0 free · 1 bump · 2 premium (DFY)
  created_at: string;
}

/** Catalog metadata only (no system_prompt) — safe for the client. */
export type TemplateCatalogItem = Pick<
  Template,
  "id" | "name" | "description" | "category" | "icon" | "tier"
>;

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  model: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  words_used: number;
  created_at: string;
}

export interface Build {
  id: string;
  user_id: string;
  title: string;
  type: string;
  model: string | null;
  idea: string | null;
  output: string | null;
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  module: AiModule;
  words_used: number;
  model: string;
  created_at: string;
}

export interface AppSetting {
  key: string;
  value: string | null;
}

export interface Branding {
  owner_id: string;
  app_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  custom_domain: string | null;
  updated_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  type: "image" | "video";
  prompt: string | null;
  aspect_ratio: string | null;
  storage_path: string;
  content_type: string | null;
  created_at: string;
}

export type ResourceSection = "training" | "vip" | "reseller";
export type ResourceType = "video" | "pdf" | "link";

export interface Resource {
  id: string;
  section: ResourceSection;
  title: string;
  description: string | null;
  url: string | null;
  type: ResourceType;
  sort_order: number;
  created_at: string;
}
