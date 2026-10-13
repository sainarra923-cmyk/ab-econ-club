"use client";

/** Submit button that asks before doing something destructive. */
export function ConfirmButton({
  message,
  children,
  className = "btn btn-danger",
}: {
  message: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
