// Gradient initials avatar — no logo upload required.
export function VendorAvatar({
  name,
  hue,
  size = "md",
}: {
  name: string;
  hue: number;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  const dim = size === "sm" ? "h-9 w-9 text-xs" : size === "lg" ? "h-16 w-16 text-xl" : "h-12 w-12 text-sm";
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-extrabold text-white ${dim}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 45% 28%) 0%, hsl(${(hue + 28) % 360} 50% 42%) 100%)` }}
      aria-hidden="true"
    >
      {initials || "•"}
    </span>
  );
}
