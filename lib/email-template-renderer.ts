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
    html: textToHtml(text),
  };
}

