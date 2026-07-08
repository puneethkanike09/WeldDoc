import { Resend } from "resend";

let client: Resend | null = null;

export function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export function getResendFrom(): string {
  return process.env.RESEND_FROM_EMAIL || "WeldDoc <hello@welddoc.in>";
}

export interface SendEmailInput {
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail(
  input: SendEmailInput,
): Promise<{ sent: boolean; error?: string; id?: string }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };
  if (input.to.length === 0) return { sent: false, error: "No recipients" };

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
    });
    if (error) return { sent: false, error: error.message };
    return { sent: true, id: data?.id };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}

/** One Resend API call per recipient — use for expiry digests to multiple inboxes. */
export async function sendBatchEmails(
  messages: SendEmailInput[],
): Promise<{ sent: boolean; error?: string; count?: number }> {
  const resend = getResendClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };
  if (messages.length === 0) return { sent: false, error: "No messages" };

  const from = getResendFrom();
  try {
    const { data, error } = await resend.batch.send(
      messages.map((m) => ({
        from,
        to: m.to,
        subject: m.subject,
        html: m.html,
      })),
    );
    if (error) return { sent: false, error: error.message };
    return { sent: true, count: data?.data?.length ?? messages.length };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "batch send failed" };
  }
}

export type ExpiryReminderKind = "certificate" | "continuity";

/** Forge Steel palette — matches app theme (navy + amber). */
const EMAIL = {
  canvas: "#f5f0e8",
  panel: "#ffffff",
  border: "#e0d8ca",
  navy: "#1c2b3a",
  parchment: "#f5f0e8",
  ember: "#e8a030",
  text: "#1c2b3a",
  textSecondary: "#3c4a57",
  muted: "#7d8896",
  dueSoon: "#8a6400",
  overdue: "#b23a15",
} as const;

function emailHeader(): string {
  return `
        <div style="background:${EMAIL.navy};padding:18px 24px">
          <span style="font-family:Helvetica,Arial,sans-serif;font-size:18px;font-weight:700">
            <span style="color:${EMAIL.parchment}">Weld</span><span style="color:${EMAIL.ember}">.Doc</span>
          </span>
        </div>`;
}

function emailShell(body: string, maxWidth = 640): string {
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;background:${EMAIL.canvas};padding:24px">
      <div style="max-width:${maxWidth}px;margin:0 auto;background:${EMAIL.panel};border:1px solid ${EMAIL.border};border-radius:16px;overflow:hidden">
        ${emailHeader()}
        <div style="padding:24px">${body}</div>
      </div>
    </div>`;
}

export interface ExpiryAlert {
  welderName: string;
  plantWelderId: string;
  process: string;
  validityCode: string;
  expiryDate: string;
  daysLeft: number;
  reminderKind: ExpiryReminderKind;
}

function reminderKindLabel(kind: ExpiryReminderKind): string {
  return kind === "continuity" ? "Continuity check" : "Certificate expiry";
}

function dueCell(daysLeft: number, expiryDate: string): string {
  const label =
    daysLeft < 0
      ? `${Math.abs(daysLeft)}d overdue`
      : `${daysLeft}d`;
  const color = daysLeft < 0 ? EMAIL.overdue : EMAIL.dueSoon;
  return `<td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};color:${color};font-weight:600;white-space:nowrap">${expiryDate} (${label})</td>`;
}

/** Org digest scope — welder-only, operator-only, or combined. */
export type ExpiryDigestKind = "welder" | "operator" | "mixed";

function digestCopy(kind: ExpiryDigestKind): {
  heading: string;
  nameColumn: string;
  subject: (count: number) => string;
} {
  switch (kind) {
    case "operator":
      return {
        heading: "Operator qualification reminders",
        nameColumn: "Operator",
        subject: (n) => `WeldDoc — ${n} operator qualification reminder(s)`,
      };
    case "mixed":
      return {
        heading: "Qualification reminders",
        nameColumn: "Person",
        subject: (n) => `WeldDoc — ${n} qualification reminder(s)`,
      };
    default:
      return {
        heading: "Welder qualification reminders",
        nameColumn: "Welder",
        subject: (n) => `WeldDoc — ${n} welder qualification reminder(s)`,
      };
  }
}

function expiryDigestHtml(
  orgName: string,
  alerts: ExpiryAlert[],
  kind: ExpiryDigestKind,
): string {
  const copy = digestCopy(kind);
  const rows = alerts
    .map(
      (a) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};font-weight:600;color:${EMAIL.text};white-space:nowrap">${a.welderName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};color:${EMAIL.textSecondary};white-space:nowrap">${a.plantWelderId}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};color:${EMAIL.textSecondary};white-space:nowrap">${a.process}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};color:${EMAIL.textSecondary};white-space:nowrap">${reminderKindLabel(a.reminderKind)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid ${EMAIL.border};color:${EMAIL.textSecondary};white-space:nowrap">${a.validityCode}</td>
        ${dueCell(a.daysLeft, a.expiryDate)}
      </tr>`,
    )
    .join("");

  return emailShell(`
          <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:18px;color:${EMAIL.text};margin:0 0 6px">${copy.heading}</h1>
          <p style="color:${EMAIL.textSecondary};margin:0 0 18px">${orgName} — ${alerts.length} qualification(s) need attention.</p>
          <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;width:100%;max-width:100%">
            <table style="min-width:640px;width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="text-align:left;color:${EMAIL.muted};font-size:11px;text-transform:uppercase">
                  <th style="padding:8px 12px;white-space:nowrap">${copy.nameColumn}</th>
                  <th style="padding:8px 12px;white-space:nowrap">Plant ID</th>
                  <th style="padding:8px 12px;white-space:nowrap">Process</th>
                  <th style="padding:8px 12px;white-space:nowrap">Reminder</th>
                  <th style="padding:8px 12px;white-space:nowrap">Method</th>
                  <th style="padding:8px 12px;white-space:nowrap">Due</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <p style="color:${EMAIL.muted};font-size:12px;margin-top:18px">Log a continuity confirmation or revalidation report in WeldDoc to reset the clock.</p>
  `);
}

export async function sendExpiryDigest(
  to: string[],
  orgName: string,
  alerts: ExpiryAlert[],
  kind: ExpiryDigestKind = "welder",
): Promise<{ sent: boolean; error?: string }> {
  if (to.length === 0) return { sent: false, error: "No recipients" };

  const subject = digestCopy(kind).subject(alerts.length);
  const html = expiryDigestHtml(orgName, alerts, kind);

  if (to.length === 1) {
    return sendEmail({ to, subject, html });
  }

  const result = await sendBatchEmails(
    to.map((email) => ({ to: [email], subject, html })),
  );
  return { sent: result.sent, error: result.error };
}

function formatDigestDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function statusSection(
  title: string,
  items: ExpiryAlert[],
  emptyLabel: string,
  lineFn: (a: ExpiryAlert) => string,
): string {
  if (items.length === 0) {
    return `<p style="margin:0 0 16px;color:${EMAIL.textSecondary};font-size:14px">✅ ${emptyLabel}</p>`;
  }
  const lines = items.map((a) => `<li style="margin:0 0 6px;color:${EMAIL.textSecondary};font-size:13px">${lineFn(a)}</li>`).join("");
  return `
    <div style="margin:0 0 20px">
      <p style="margin:0 0 8px;font-weight:700;color:${EMAIL.text};font-size:14px">${title} (${items.length})</p>
      <ul style="margin:0;padding-left:18px">${lines}</ul>
    </div>`;
}

/** Sectioned status digest for repeating schedules (daily, weekly, etc.). */
export function expiryStatusDigestHtml(
  orgName: string,
  alerts: ExpiryAlert[],
  leadDays: number[],
  checkedOn: string,
  kind: ExpiryDigestKind,
): string {
  const personLabel =
    kind === "operator" ? "Operator" : kind === "mixed" ? "Person" : "Welder";
  const sortedLeads = [...leadDays].sort((a, b) => b - a);

  const expired = alerts.filter((a) => a.daysLeft < 0);
  const today = alerts.filter((a) => a.daysLeft === 0);

  const leadSections = sortedLeads.map((lead) => {
    const inBucket = alerts.filter(
      (a) => a.daysLeft > 0 && a.daysLeft <= lead,
    );
    return {
      lead,
      items: inBucket,
    };
  });

  let sectionsHtml = statusSection(
    "ALREADY EXPIRED",
    expired,
    "No certificates or continuity checks overdue",
    (a) =>
      `${personLabel} No: ${a.plantWelderId} | Process: ${a.process} | ${reminderKindLabel(a.reminderKind)} | Expired: ${formatDigestDate(a.expiryDate)} (${Math.abs(a.daysLeft)} days ago)`,
  );

  sectionsHtml += statusSection(
    "EXPIRES TODAY",
    today,
    "No certificates or continuity checks due today",
    (a) =>
      `${personLabel} No: ${a.plantWelderId} | Process: ${a.process} | ${reminderKindLabel(a.reminderKind)} | Due: ${formatDigestDate(a.expiryDate)}`,
  );

  for (const { lead, items } of leadSections) {
    sectionsHtml += statusSection(
      `EXPIRING WITHIN ${lead} DAYS`,
      items,
      `No certificates or continuity checks expiring within ${lead} days`,
      (a) =>
        `${personLabel} No: ${a.plantWelderId} | Process: ${a.process} | ${reminderKindLabel(a.reminderKind)} | Due: ${formatDigestDate(a.expiryDate)} (${a.daysLeft}d)`,
    );
  }

  const heading =
    kind === "operator"
      ? "Operator qualification expiry status"
      : kind === "mixed"
        ? "Qualification expiry status"
        : "Welder certificate expiry status";

  return emailShell(`
          <p style="color:${EMAIL.textSecondary};margin:0 0 4px;font-size:14px">Hi,</p>
          <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:18px;color:${EMAIL.text};margin:0 0 16px">${heading}</h1>
          <p style="color:${EMAIL.textSecondary};margin:0 0 20px;font-size:13px">${orgName}</p>
          ${sectionsHtml}
          <hr style="border:none;border-top:1px solid ${EMAIL.border};margin:20px 0" />
          <p style="color:${EMAIL.muted};font-size:12px;margin:0">Checked on: ${formatDigestDate(checkedOn)}</p>
          <p style="color:${EMAIL.muted};font-size:12px;margin:8px 0 0">This alert was sent automatically from WeldDoc.</p>
  `);
}

export async function sendExpiryStatusDigest(
  to: string[],
  orgName: string,
  alerts: ExpiryAlert[],
  leadDays: number[],
  checkedOn: string,
  kind: ExpiryDigestKind = "welder",
): Promise<{ sent: boolean; error?: string }> {
  if (to.length === 0) return { sent: false, error: "No recipients" };

  const subject = `WeldDoc — qualification status for ${orgName}`;
  const html = expiryStatusDigestHtml(orgName, alerts, leadDays, checkedOn, kind);

  if (to.length === 1) {
    return sendEmail({ to, subject, html });
  }

  const result = await sendBatchEmails(
    to.map((email) => ({ to: [email], subject, html })),
  );
  return { sent: result.sent, error: result.error };
}

export async function sendOrgWelcomeEmail(
  to: string[],
  orgName: string,
): Promise<{ sent: boolean; error?: string; id?: string }> {
  const html = emailShell(`
          <h1 style="font-family:Helvetica,Arial,sans-serif;font-size:18px;color:${EMAIL.text};margin:0 0 12px">Email alerts are connected</h1>
          <p style="color:${EMAIL.textSecondary};margin:0 0 12px;line-height:1.5">
            This is a test message for <strong>${orgName}</strong>. WeldDoc can now send
            qualification expiry and continuity reminders to your organisation.
          </p>
          <p style="color:${EMAIL.muted};font-size:13px;margin:0">
            Manage recipients from the Welders or Operators page → Alert email configuration.
          </p>
  `, 560);

  return sendEmail({
    to,
    subject: `WeldDoc — email alerts connected for ${orgName}`,
    html,
  });
}
