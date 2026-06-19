import { cn } from "@/lib/utils";

export function PageIntro({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[15px] text-graphite", className)}>{children}</p>
  );
}
