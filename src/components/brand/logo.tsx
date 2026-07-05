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
      <span className={onDark ? "text-white" : "text-midnight"}>Weld</span>
      <span className="text-ember">.Doc</span>
    </span>
  );
}
