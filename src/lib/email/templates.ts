function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function collaborationEmailTemplate(args: {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.solarpunktaskforce.org").replace(/\/$/, "");
  const url = args.ctaHref.startsWith("http") ? args.ctaHref : `${siteUrl}${args.ctaHref}`;

  const title = escapeHtml(args.title);
  const body = escapeHtml(args.body);
  const ctaLabel = escapeHtml(args.ctaLabel);

  const html = `
  <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color:#0f172a;">
    <h2 style="margin:0 0 12px 0;">${title}</h2>
    <p style="margin:0 0 16px 0; color:#334155;">${body}</p>
    <p style="margin:0 0 22px 0;">
      <a href="${url}" style="display:inline-block; background:#0f172a; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:10px; font-weight:600;">
        ${ctaLabel}
      </a>
    </p>
    <p style="margin:0; font-size:12px; color:#64748b;">
      Solarpunk Taskforce · You can disable email notifications in Settings.
    </p>
  </div>`;

  const text = `${args.title}\n\n${args.body}\n\n${url}\n\nSolarpunk Taskforce`;

  return { html, text, url };
}
