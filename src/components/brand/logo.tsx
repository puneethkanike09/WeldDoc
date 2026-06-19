import { cn } from "@/lib/utils";

export function Logo({
  className,
  showText = true,
  onDark = false,
}: {
  className?: string;
  showText?: boolean;
  onDark?: boolean;
}) {
  if (!showText) return null;

  return (
    <span
      className={cn(
        "font-display text-[20px] font-bold tracking-tight",
        className,
      )}
    >
      <span className="text-brand-red">Weld.</span>
      <span className={onDark ? "text-white" : "text-brand-black"}>Doc</span>
    </span>
  );
}
