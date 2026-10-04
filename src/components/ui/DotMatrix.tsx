/** Small, self-contained LED lettering; no remote font dependency. */
const glyphs: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  I: ["111", "010", "010", "010", "010", "010", "111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  ".": ["0", "0", "0", "0", "0", "1", "1"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};

export default function DotMatrix({ text, className = "" }: { text: string; className?: string }) {
  let offset = 0;
  const dots: React.ReactNode[] = [];
  for (const [index, character] of Array.from(text.toUpperCase()).entries()) {
    const rows = glyphs[character] ?? glyphs[" "];
    rows.forEach((row, y) => Array.from(row).forEach((pixel, x) => {
      if (pixel === "1") dots.push(<circle key={`${index}-${x}-${y}`} cx={offset + x * 4 + 2} cy={y * 4 + 2} r="1.35" />);
    }));
    offset += (rows[0].length + 1) * 4;
  }
  return <svg role="img" aria-label={text} viewBox={`0 0 ${offset} 28`} className={className} fill="currentColor">{dots}</svg>;
}

export function GlyphOrb({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" fill="none" aria-hidden="true" className={className}>
      <circle cx="80" cy="80" r="71" stroke="currentColor" strokeWidth="3" strokeDasharray="0.1 8" strokeLinecap="round" opacity=".25" />
      <circle cx="80" cy="80" r="55" stroke="currentColor" strokeWidth="9" strokeDasharray="225 121" transform="rotate(-72 80 80)" />
      <circle cx="80" cy="80" r="37" stroke="currentColor" strokeWidth="3" strokeDasharray="0.1 7" strokeLinecap="round" opacity=".6" />
      <path d="M80 56V83L99 96" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />
      <circle cx="128" cy="111" r="8" fill="var(--primary)" />
    </svg>
  );
}
