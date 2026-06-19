import { Resend } from "resend";

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export interface ExpiryAlert {
  welderName: string;
  uid: string;
  process: string;
  expiryDate: string;
  daysLeft: number;
  kind: "expiry" | "continuity";
}

export async function sendExpiryDigest(
  to: string[],
  orgName: string,
  alerts: ExpiryAlert[],
): Promise<{ sent: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) return { sent: false, error: "RESEND_API_KEY not configured" };
  if (to.length === 0) return { sent: false, error: "No recipients" };

  const from = process.env.RESEND_FROM_EMAIL || "WeldDoc <alerts@welddoc.in>";

  const rows = alerts
    .map(
      (a) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e2e4;font-weight:600;color:#161616">${a.welderName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e2e4;color:#4a4a4a">${a.uid}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e2e4;color:#4a4a4a">${a.process}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e2e4;color:#4a4a4a">${a.kind === "continuity" ? "6-month continuity" : "Qualification expiry"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e2e4;color:${a.daysLeft < 0 ? "#912e1f" : "#f90a08"};font-weight:600">${a.expiryDate} (${a.daysLeft < 0 ? `${Math.abs(a.daysLeft)}d overdue` : `${a.daysLeft}d`})</td>
      </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family:Helvetica,Arial,sans-serif;background:#f8faf9;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e2e2e4;border-radius:16px;overflow:hidden">
        <div style="background:#161616;padding:18px 24px">
          <span style="font-size:18px;font-weight:700"><span style="color:#f90a08">Weld.</span><span style="color:#fff">Doc</span></span>
        </div>
        <div style="padding:24px">
          <h1 style="font-size:18px;color:#161616;margin:0 0 6px">Welder qualification reminders</h1>
          <p style="color:#4a4a4a;margin:0 0 18px">${orgName} — ${alerts.length} qualification(s) need attention.</p>
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="text-align:left;color:#9297a0;font-size:11px;text-transform:uppercase">
                <th style="padding:8px 12px">Welder</th>
                <th style="padding:8px 12px">UID</th>
                <th style="padding:8px 12px">Process</th>
                <th style="padding:8px 12px">Type</th>
                <th style="padding:8px 12px">Due</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="color:#9297a0;font-size:12px;margin-top:18px">Log a continuity confirmation or revalidation report in WeldDoc to reset the clock.</p>
        </div>
      </div>
    </div>`;

  try {
    await resend.emails.send({
      from,
      to,
      subject: `WeldDoc — ${alerts.length} welder qualification reminder(s)`,
      html,
    });
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : "send failed" };
  }
}
