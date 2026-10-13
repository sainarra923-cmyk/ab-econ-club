import "server-only";

export type OutgoingEmail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
};

/** Sends emails through Resend in batches of 100. Returns how many were accepted. */
export async function sendEmails(emails: OutgoingEmail[]): Promise<{ sent: number; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM_EMAIL;
  if (!key || !from) {
    return { sent: 0, error: "Email isn't set up yet. Add RESEND_API_KEY and NEWSLETTER_FROM_EMAIL in Vercel." };
  }

  let sent = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100).map((e) => ({ from, ...e }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(batch),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return { sent, error: `Resend rejected the send (${res.status}). ${detail.slice(0, 300)}` };
    }
    sent += batch.length;
  }
  return { sent };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Plain, readable email layout that matches the site. */
export function emailLayout(opts: { heading: string; bodyHtml: string; unsubscribeUrl?: string; siteUrl: string }) {
  const footer = opts.unsubscribeUrl
    ? `<p style="margin:28px 0 0;font-size:13px;color:#6d7a8d;">You're getting this because you signed up for the AB Econ newsletter. <a href="${opts.unsubscribeUrl}" style="color:#1f4590;">Unsubscribe</a>.</p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#f5f7fa;">
<div style="max-width:600px;margin:0 auto;padding:32px 24px;font-family:Georgia,'Times New Roman',serif;color:#0e2340;">
  <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;color:#4b5a70;">Acton-Boxborough</p>
  <p style="margin:0 0 10px;font-size:26px;font-weight:bold;">Economics Club</p>
  <div style="border-top:2px solid #0e2340;border-bottom:2px solid #0e2340;height:4px;margin-bottom:28px;"></div>
  <h1 style="font-size:28px;line-height:1.2;margin:0 0 16px;font-weight:600;">${escapeHtml(opts.heading)}</h1>
  <div style="font-size:17px;line-height:1.65;">${opts.bodyHtml}</div>
  ${footer}
  <p style="margin:12px 0 0;font-size:13px;"><a href="${opts.siteUrl}" style="color:#1f4590;">${opts.siteUrl.replace(/^https?:\/\//, "")}</a></p>
</div></body></html>`;
}
