import { ENTITLEMENT_DEFAULTS, type Entitlements, type Profile } from "@/types/db";

export const ENTITLEMENT_KEYS = Object.keys(
  ENTITLEMENT_DEFAULTS
) as (keyof Entitlements)[];

/**
 * Effective entitlements for a user. Source of truth is the profile itself
 * (so OTO purchases can stack). Falls back to safe defaults.
 */
export function getEntitlements(
  profile: Pick<Profile, keyof Entitlements> | null | undefined
): Entitlements {
  if (!profile) return { ...ENTITLEMENT_DEFAULTS };
  return {
    is_unlimited: !!profile.is_unlimited,
    template_level: profile.template_level ?? 0,
    feature_pro: !!profile.feature_pro,
    feature_bulk: !!profile.feature_bulk,
    feature_traffic: !!profile.feature_traffic,
    feature_media: !!profile.feature_media,
    is_agency: !!profile.is_agency,
    agency_accounts: profile.agency_accounts ?? 0,
    seats: profile.seats ?? 1,
    is_whitelabel: !!profile.is_whitelabel,
    is_reseller: !!profile.is_reseller,
    is_vip: !!profile.is_vip,
  };
}

/** Pull just the entitlement fields out of a plan/profile-like object. */
export function pickEntitlements(
  source: Partial<Entitlements> | null | undefined
): Entitlements {
  const out = { ...ENTITLEMENT_DEFAULTS };
  if (!source) return out;
  for (const key of ENTITLEMENT_KEYS) {
    const v = source[key];
    if (v !== undefined && v !== null) {
      // @ts-expect-error index assignment across union of number|boolean
      out[key] = v;
    }
  }
  return out;
}
