import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  children,
  className,
}: {
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-silver bg-white/60 px-8 py-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <h1 className="font-display text-[26px] font-bold tracking-tight text-onyx">
        {title}
      </h1>
      {children && <div className="flex items-center gap-2.5">{children}</div>}
    </div>
  );
}
