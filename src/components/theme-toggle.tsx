"use client";

/**
 * Sun/moon button that switches between light and dark mode.
 * The choice is saved in the visitor's browser, so it sticks on their next visit.
 * Both icons are always in the page; CSS shows the right one, so nothing flickers.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Private browsing can block storage. The switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="theme-toggle flex h-8 w-8 items-center justify-center rounded-full text-slate transition-colors hover:text-ink"
      aria-label="Switch between light and dark mode"
      title="Light or dark"
    >
      {/* Moon: shown in light mode, switches to dark */}
      <svg className="icon-moon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
      </svg>
      {/* Sun: shown in dark mode, switches to light */}
      <svg className="icon-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
      </svg>
    </button>
  );
}
