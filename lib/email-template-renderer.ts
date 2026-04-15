import {
  EMAIL_TEMPLATES,
  type EmailTemplateKey,
  type EmailTemplateVariables,
} from "@/lib/email-templates";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function replaceVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return variables[key] ?? "";
  });
}

function textToHtml(value: string) {
  return escapeHtml(value)
    .split("\n\n")
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

export function renderBrandedEmail({
  eyebrow,
  heading,
  intro,
  body,
  footerNote,
}: {
  eyebrow?: string;
  heading: string;
  intro?: string;
  body: string;
  footerNote?: string;
}) {
  const business = getBusinessTemplateVariables();
  const contactLine = [business.business_email, business.business_phone]
    .filter(Boolean)
    .join(" • ");

  return `
    <div style="margin:0;padding:32px 16px;background:#f6f0e8;font-family:Inter,Arial,sans-serif;color:#241d18;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="padding:0 0 18px;">
            <div style="background:#fffdf9;border:1px solid rgba(121,94,61,0.12);border-radius:28px;overflow:hidden;box-shadow:0 18px 40px rgba(44,31,18,0.08);">
              <div style="padding:24px 28px;border-bottom:1px solid rgba(121,94,61,0.1);background:linear-gradient(180deg,#fffefc 0%,#faf4ec 100%);">
                <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:10px;">${escapeHtml(
                  eyebrow || "Elel Events & Design"
                )}</div>
                <div style="font-family:Playfair Display,Georgia,serif;font-size:36px;line-height:1.02;letter-spacing:-0.04em;color:#231b16;margin:0 0 10px;">${escapeHtml(
                  heading
                )}</div>
                ${
                  intro
                    ? `<div style="font-size:18px;line-height:1.7;color:#5f5448;max-width:560px;">${escapeHtml(intro)}</div>`
                    : ""
                }
              </div>

              <div style="padding:28px;">
                <div style="font-size:16px;line-height:1.78;color:#342c25;">${body}</div>
              </div>

              <div style="padding:20px 28px;border-top:1px solid rgba(121,94,61,0.1);background:#fcf8f2;">
                <div style="font-weight:700;color:#231b16;margin-bottom:6px;">${escapeHtml(
                  String(business.business_name)
                )}</div>
                ${
                  contactLine
                    ? `<div style="font-size:14px;line-height:1.6;color:#6d5f52;">${escapeHtml(contactLine)}</div>`
                    : ""
                }
                ${
                  business.website_url
                    ? `<div style="font-size:14px;line-height:1.6;color:#6d5f52;">${escapeHtml(
                        String(business.website_url)
                      )}</div>`
                    : ""
                }
                ${
                  footerNote
                    ? `<div style="margin-top:10px;font-size:13px;line-height:1.6;color:#8a7b6c;">${escapeHtml(
                        footerNote
                      )}</div>`
                    : ""
                }
              </div>
            </div>
          </td>
        </tr>
      </table>
    </div>
  `;
}

export function getBusinessTemplateVariables(overrides: EmailTemplateVariables = {}) {
  const businessName = String(
    overrides.business_name ??
      process.env.BUSINESS_NAME ??
      "Elel Events & Design"
  );
  const businessEmail = String(
    overrides.business_email ??
      process.env.BUSINESS_EMAIL ??
      process.env.NOTIFICATION_FROM_EMAIL ??
      ""
  );
  const businessPhone = String(
    overrides.business_phone ?? process.env.BUSINESS_PHONE ?? ""
  );
  const websiteUrl = String(
    overrides.website_url ??
      process.env.WEBSITE_URL ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      ""
  );

  return {
    business_name: businessName,
    business_email: businessEmail,
    business_phone: businessPhone,
    website_url: websiteUrl,
  };
}

export function renderEmailTemplate(
  key: EmailTemplateKey,
  variables: EmailTemplateVariables
) {
  const template = EMAIL_TEMPLATES[key];
  const mergedVariables = {
    ...getBusinessTemplateVariables(),
    ...Object.fromEntries(
      Object.entries(variables).map(([name, value]) => [name, value == null ? "" : String(value)])
    ),
  };

  const subject = replaceVariables(template.subject, mergedVariables);
  const text = replaceVariables(template.body, mergedVariables).trim();

  return {
    subject,
    text,
    html: renderBrandedEmail({
      heading: subject,
      body: textToHtml(text),
    }),
  };
}
