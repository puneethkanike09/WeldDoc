import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-silver bg-panel/60 px-8 py-6 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <h1 className="font-display text-[26px] font-bold tracking-tight text-onyx">
          {title}
        </h1>
        {description && (
          <p className="text-[15px] text-graphite">
            <span className="mr-2.5 text-brand-red">—</span>
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex shrink-0 items-center gap-2.5">{children}</div>
      )}
    </div>
  );
}
