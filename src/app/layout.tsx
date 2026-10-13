import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/env";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.name, template: `%s | ${site.shortName}` },
  description: site.tagline,
  openGraph: { siteName: site.name, type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
};

// Runs before the page is drawn, so there's no flash of the wrong colors.
// Uses the visitor's saved choice from the sun/moon toggle if they made one,
// otherwise follows their device setting (and keeps following it if it changes).
const themeScript = `(function(){
  var d=document.documentElement, m=window.matchMedia("(prefers-color-scheme: dark)");
  function saved(){try{return localStorage.getItem("theme")}catch(e){return null}}
  function apply(){var t=saved();d.setAttribute("data-theme",t==="dark"||t==="light"?t:(m.matches?"dark":"light"))}
  apply();
  m.addEventListener("change",function(){if(!saved())apply()});
})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-screen flex-col antialiased">{children}</body>
    </html>
  );
}
