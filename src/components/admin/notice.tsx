export function Notice({ tone = "ok", children }: { tone?: "ok" | "error" | "info"; children: React.ReactNode }) {
  const styles =
    tone === "ok"
      ? "border-ok/40 text-ok"
      : tone === "error"
        ? "border-danger/40 text-danger"
        : "border-rule text-slate";
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`border-l-4 bg-surface px-4 py-3 text-[0.9375rem] ${styles}`}>
      {children}
    </div>
  );
}

export function PageTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <h1 className="headline text-[2rem] sm:text-[2.4rem]">{children}</h1>
      {action}
    </div>
  );
}
