export default function BrandLogo({
  brandName,
  brandLogo,
  compact = false,
}: {
  brandName?: string | null;
  brandLogo?: string | null;
  compact?: boolean;
}) {
  if (brandName && !brandLogo) {
    return <span className="font-semibold tracking-tight">{brandName}</span>;
  }

  return (
    <span className={`os-logo ${compact ? "os-logo-compact" : ""} ${brandLogo ? "os-logo-custom" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brandLogo || "/argonmax-logo.png"}
        alt={brandName || "ArgonMax AI"}
        width={brandLogo ? undefined : 2172}
        height={brandLogo ? undefined : 724}
      />
    </span>
  );
}
