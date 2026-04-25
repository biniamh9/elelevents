import {
  EMAIL_TEMPLATES,
  type EmailTemplateKey,
  type EmailTemplateVariables,
} from "@/lib/email-templates";

export function escapeHtml(value: string) {
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

function resolveTemplateValue(template: string | undefined, variables: Record<string, string>) {
  if (!template) return "";
  return replaceVariables(template, variables);
}

function textToHtml(value: string) {
  return escapeHtml(value)
    .split("\n\n")
    .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br/>")}</p>`)
    .join("");
}

type EmailInfoRow = {
  label: string;
  value: string;
};

type EmailTableColumn = {
  label: string;
  align?: "left" | "center" | "right";
};

type EmailAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type QuoteItemizedLineItem = {
  item_name: string;
  variant: string | null;
  quantity: number;
  unit_label: string | null;
  unit_price: number;
  line_total: number;
  notes: string | null;
};

type RentalRequestLineItem = {
  item_name: string;
  quantity: number;
  line_subtotal: number;
};

type EmailSummaryValueRow = {
  label: string;
  value: string | number;
};

function cardShell(content: string) {
  return `
    <div style="padding:22px 24px;border:1px solid rgba(121,94,61,0.12);border-radius:24px;background:linear-gradient(180deg,rgba(255,255,253,0.98),rgba(250,244,236,0.96));box-shadow:inset 0 1px 0 rgba(255,255,255,0.6);">
      ${content}
    </div>
  `;
}

export function renderEmailCardTitle(title: string) {
  return `<div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;font-weight:700;color:#8a5f3a;margin-bottom:14px;">${escapeHtml(
    title
  )}</div>`;
}

export function renderEmailInfoCard(title: string, rows: EmailInfoRow[]) {
  const content = rows
    .map(
      (row, index) => `
        <tr>
          <td style="padding:${index === rows.length - 1 ? "0" : "0 0 12px"};color:#6a5a49;">${escapeHtml(
            row.label
          )}</td>
          <td style="padding:${index === rows.length - 1 ? "0" : "0 0 12px"};text-align:right;font-weight:700;color:#241d18;">${row.value}</td>
        </tr>
      `
    )
    .join("");

  return cardShell(`
    ${renderEmailCardTitle(title)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      ${content}
    </table>
  `);
}

export function renderEmailContentCard(title: string, content: string) {
  return cardShell(`
    ${renderEmailCardTitle(title)}
    <div style="color:#342c25;line-height:1.8;">${content}</div>
  `);
}

export function renderEmailNotesSection(
  title: string,
  content: string,
  fallback = "No notes submitted."
) {
  const normalized = content.trim();
  return renderEmailContentCard(
    title,
    escapeHtml(normalized || fallback).replace(/\n/g, "<br />")
  );
}

export function renderEmailTableCard(
  title: string,
  columns: EmailTableColumn[],
  rows: string[][]
) {
  const header = columns
    .map(
      (column) => `
        <th align="${column.align ?? "left"}" style="padding:14px 16px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#6d5f52;background:#faf4ec;">
          ${escapeHtml(column.label)}
        </th>
      `
    )
    .join("");

  const body = rows
    .map(
      (row) => `
        <tr>
          ${row
            .map((value, index) => {
              const align = columns[index]?.align ?? "left";
              return `<td align="${align}" style="padding:16px;border-top:1px solid rgba(121,94,61,0.08);vertical-align:top;color:#241d18;">${value}</td>`;
            })
            .join("")}
        </tr>
      `
    )
    .join("");

  return `
    <div style="margin:22px 0 0;">
      ${renderEmailCardTitle(title)}
      <div style="border:1px solid rgba(121,94,61,0.12);border-radius:24px;overflow:hidden;background:linear-gradient(180deg,rgba(255,255,253,0.98),rgba(250,244,236,0.96));box-shadow:0 16px 32px rgba(44,31,18,0.04);">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead><tr>${header}</tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </div>
  `;
}

function formatEmailCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function renderQuoteItemizedScopeSection(lineItems: QuoteItemizedLineItem[]) {
  if (!lineItems.length) {
    return renderEmailContentCard(
      "Itemized scope",
      "This proposal currently includes planning totals only. We can revise the scope together if you need a more detailed breakdown."
    );
  }

  return renderEmailTableCard(
    "Itemized scope",
    [
      { label: "Item", align: "left" },
      { label: "Qty", align: "center" },
      { label: "Unit", align: "right" },
      { label: "Line total", align: "right" },
    ],
    lineItems.map((item) => [
      `
        <div style="font-weight:700;color:#241d18;">${escapeHtml(item.item_name)}</div>
        ${
          item.variant
            ? `<div style="font-size:14px;color:#6d5f52;margin-top:4px;">${escapeHtml(item.variant)}</div>`
            : ""
        }
        ${
          item.notes
            ? `<div style="font-size:13px;color:#8a7b6c;margin-top:6px;line-height:1.6;">${escapeHtml(item.notes)}</div>`
            : ""
        }
      `,
      String(item.quantity),
      escapeHtml(
        `${formatEmailCurrency(item.unit_price)}${
          item.unit_label ? ` / ${item.unit_label}` : ""
        }`
      ),
      escapeHtml(formatEmailCurrency(item.line_total)),
    ])
  );
}

export function renderRentalRequestItemsSection(lineItems: RentalRequestLineItem[]) {
  return renderEmailTableCard(
    "Rental items",
    [
      { label: "Item", align: "left" },
      { label: "Qty", align: "right" },
      { label: "Line total", align: "right" },
    ],
    lineItems.map((item) => [
      escapeHtml(item.item_name),
      String(item.quantity),
      escapeHtml(formatEmailCurrency(item.line_subtotal)),
    ])
  );
}

export function renderEmailPricingSummarySection(
  title: string,
  rows: EmailSummaryValueRow[]
) {
  return renderEmailInfoCard(
    title,
    rows.map((row) => ({
      label: row.label,
      value: typeof row.value === "number" ? formatEmailCurrency(row.value) : row.value,
    }))
  );
}

export function renderEmailSectionStack(sections: Array<string | null | undefined>) {
  return sections
    .filter(Boolean)
    .map((section, index) =>
      index === 0 ? String(section) : `<div style="margin-top:18px;">${String(section)}</div>`
    )
    .join("");
}

export function renderEmailActionRow(actions: EmailAction[]) {
  const cells = actions
    .map((action, index) => {
      const isPrimary = (action.variant ?? "primary") === "primary";
      const background = isPrimary
        ? "linear-gradient(180deg,#e9792a,#cf6520)"
        : "rgba(255,253,250,0.96)";
      const color = isPrimary ? "#ffffff" : "#39261a";
      const border = isPrimary
        ? "1px solid rgba(201,105,36,0.4)"
        : "1px solid rgba(121,94,61,0.18)";

      return `
        <td style="${index > 0 ? "padding-left:10px;" : "padding-right:10px;"}">
          <a href="${escapeHtml(
            action.href
          )}" style="display:block;padding:16px 18px;border-radius:18px;background:${background};color:${color};border:${border};text-decoration:none;text-align:center;font-weight:700;box-shadow:${
            isPrimary ? "0 12px 26px rgba(201,105,36,0.18)" : "none"
          };">
            ${escapeHtml(action.label)}
          </a>
        </td>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:26px 0 0;border-collapse:collapse;">
      <tr>${cells}</tr>
    </table>
  `;
}

function isMeaningfulTemplateValue(value: string) {
  const normalized = value.trim();
  if (!normalized) return false;
  if (/^\{\{.+\}\}$/.test(normalized)) return false;
  return true;
}

function renderTemplateSection(section: {
  title: string;
  content?: string;
  html?: string;
  rows?: Array<{ label: string; value: string }>;
  action?: EmailAction | null;
  actions?: EmailAction[];
}) {
  const hasRows = Boolean(section.rows?.length);
  const hasContent = Boolean(section.content && isMeaningfulTemplateValue(section.content));
  const hasHtml = Boolean(section.html && isMeaningfulTemplateValue(section.html));
  const hasAction = Boolean(section.action?.href && isMeaningfulTemplateValue(section.action.href));
  const validActions =
    section.actions?.filter((action) => isMeaningfulTemplateValue(action.href)) ?? [];

  if (!hasRows && !hasContent && !hasHtml && !hasAction && validActions.length === 0) {
    return "";
  }

  const parts = [
    hasRows ? renderEmailInfoCard(section.title, section.rows ?? []) : "",
    hasHtml ? `<div>${section.html}</div>` : "",
    !hasRows && hasContent ? renderEmailContentCard(section.title, section.content ?? "") : "",
    hasRows && hasContent
      ? `<div style="margin-top:14px;">${renderEmailContentCard(
          section.title,
          section.content ?? ""
        )}</div>`
      : "",
    hasAction ? renderEmailActionRow([section.action as EmailAction]) : "",
    validActions.length ? renderEmailActionRow(validActions) : "",
  ]
    .filter(Boolean)
    .join("");

  return `<div style="margin-top:22px;">${parts}</div>`;
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
    <div style="margin:0;padding:32px 16px;background:
      radial-gradient(circle at top, rgba(224,180,128,0.18), transparent 28%),
      linear-gradient(180deg,#f7f1e9 0%,#f2e9de 100%);
      font-family:Inter,Arial,sans-serif;color:#241d18;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:720px;margin:0 auto;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="padding:0 0 18px;">
            <div style="background:#fffdf9;border:1px solid rgba(121,94,61,0.12);border-radius:32px;overflow:hidden;box-shadow:0 24px 54px rgba(44,31,18,0.1);">
              <div style="padding:18px 28px;border-bottom:1px solid rgba(121,94,61,0.08);background:linear-gradient(90deg,rgba(36,27,22,0.98),rgba(68,43,29,0.95));">
                <div style="font-family:Playfair Display,Georgia,serif;font-size:28px;line-height:1;color:#fff8f1;letter-spacing:-0.03em;">${escapeHtml(
                  String(business.business_name)
                )}</div>
              </div>

              <div style="padding:28px 28px 24px;border-bottom:1px solid rgba(121,94,61,0.1);background:
                linear-gradient(180deg,#fffefc 0%,#faf4ec 100%),
                radial-gradient(circle at top right, rgba(224,180,128,0.18), transparent 32%);">
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

              <div style="padding:20px 28px;border-top:1px solid rgba(121,94,61,0.1);background:
                linear-gradient(180deg,#fcf8f2 0%,#f8f1e7 100%);">
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

export function getNotificationFromEmail() {
  return (
    process.env.NOTIFICATION_FROM_EMAIL ||
    process.env.BUSINESS_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "Elel Events <info@elelevents.com>"
  );
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
  const eyebrow = template.eyebrow
    ? replaceVariables(template.eyebrow, mergedVariables)
    : undefined;
  const intro = template.intro
    ? replaceVariables(template.intro, mergedVariables)
    : undefined;
  const summaryRows =
    template.summaryRows
      ?.map((row) => ({
        label: replaceVariables(row.label, mergedVariables),
        value: replaceVariables(row.value, mergedVariables),
      }))
      .filter((row) => isMeaningfulTemplateValue(row.value)) ?? [];
  const action =
    template.action
      ? {
          label: replaceVariables(template.action.label, mergedVariables),
          href: replaceVariables(template.action.href, mergedVariables),
          variant: template.action.variant,
        }
      : null;
  const actions =
    template.actions
      ?.map((action) => ({
        label: replaceVariables(action.label, mergedVariables),
        href: replaceVariables(action.href, mergedVariables),
        variant: action.variant,
      }))
      .filter((action) => isMeaningfulTemplateValue(action.href)) ?? [];
  const secondarySections =
    template.secondarySections
      ?.map((section) => ({
        title: replaceVariables(section.title, mergedVariables),
        content: section.content
          ? replaceVariables(section.content, mergedVariables)
          : undefined,
        html: section.html ? resolveTemplateValue(section.html, mergedVariables) : undefined,
        rows:
          section.rows
            ?.map((row) => ({
              label: replaceVariables(row.label, mergedVariables),
              value: replaceVariables(row.value, mergedVariables),
            }))
            .filter((row) => isMeaningfulTemplateValue(row.value)) ?? [],
        action: section.action
          ? {
              label: replaceVariables(section.action.label, mergedVariables),
              href: replaceVariables(section.action.href, mergedVariables),
              variant: section.action.variant,
            }
          : null,
        actions:
          section.actions
            ?.map((action) => ({
              label: replaceVariables(action.label, mergedVariables),
              href: replaceVariables(action.href, mergedVariables),
              variant: action.variant,
            }))
            .filter((action) => isMeaningfulTemplateValue(action.href)) ?? [],
      }))
      .filter(
        (section) =>
          (section.rows && section.rows.length > 0) ||
          (section.html && isMeaningfulTemplateValue(section.html)) ||
          (section.content && isMeaningfulTemplateValue(section.content)) ||
          (section.action?.href && isMeaningfulTemplateValue(section.action.href)) ||
          (section.actions && section.actions.length > 0)
      ) ?? [];
  const footerNote = template.footerNote
    ? replaceVariables(template.footerNote, mergedVariables)
    : undefined;
  const bodyParts = [
    textToHtml(text),
    summaryRows.length
      ? `<div style="margin-top:22px;">${renderEmailInfoCard(
          template.summaryTitle || "Details",
          summaryRows
        )}</div>`
      : "",
    action && isMeaningfulTemplateValue(action.href)
      ? renderEmailActionRow([action])
      : "",
    actions.length ? renderEmailActionRow(actions) : "",
    ...secondarySections.map((section) => renderTemplateSection(section)),
  ]
    .filter(Boolean)
    .join("");

  return {
    subject,
    text,
    html: renderBrandedEmail({
      eyebrow,
      heading: subject,
      intro,
      body: bodyParts,
      footerNote,
    }),
  };
}
