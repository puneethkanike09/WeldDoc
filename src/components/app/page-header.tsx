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
        "sticky top-0 z-20 flex min-w-0 max-w-full flex-col gap-4 border-b border-silver bg-panel px-4 py-5 sm:px-6 sm:py-6 lg:px-8",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-1">
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
        <div className="flex shrink-0 flex-wrap items-center gap-2.5">{children}</div>
      )}
      </div>
    </div>
  );
}
