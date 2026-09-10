import { EmailParams, MailerSend, Recipient, Sender } from "mailersend";
import { siteConfig } from "@/lib/site";

export function isMailerSendConfigured(): boolean {
  return Boolean(
    process.env.MAILERSEND_API_KEY?.trim() &&
      process.env.MAILERSEND_FROM_EMAIL?.trim()
  );
}

function notifyEmail(): string {
  return (
    process.env.CONTACT_NOTIFY_EMAIL?.trim() || siteConfig.contact.email
  );
}

function fromName(): string {
  return process.env.MAILERSEND_FROM_NAME?.trim() || siteConfig.name;
}

export type ContactEmailPayload = {
  name: string;
  email: string;
  phone?: string | null;
  project: string;
  budget?: string | null;
  message: string;
};

function buildHtml(data: ContactEmailPayload): string {
  const rows = [
    ["Name", data.name],
    ["Email", data.email],
    ["Phone", data.phone || "—"],
    ["Project type", data.project],
    ["Budget", data.budget || "—"],
    ["Message", data.message],
  ];

  const body = rows
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#6b7280;font-size:13px;vertical-align:top">${label}</td><td style="padding:8px 0;font-size:14px;color:#111">${String(value).replace(/\n/g, "<br>")}</td></tr>`
    )
    .join("");

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="color:#102A43;margin:0 0 16px">New enquiry — ${siteConfig.name}</h2>
      <table style="border-collapse:collapse;width:100%">${body}</table>
      <p style="margin-top:24px;font-size:12px;color:#9ca3af">Reply directly to ${data.email}</p>
    </div>
  `.trim();
}

export async function sendContactNotification(
  data: ContactEmailPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!isMailerSendConfigured()) {
    return { ok: false, error: "MailerSend not configured" };
  }

  const mailersend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY!,
  });

  const fromEmail = process.env.MAILERSEND_FROM_EMAIL!.trim();
  const to = notifyEmail();

  const emailParams = new EmailParams()
    .setFrom(new Sender(fromEmail, fromName()))
    .setTo([new Recipient(to, siteConfig.name)])
    .setReplyTo(new Recipient(data.email, data.name))
    .setSubject(`New enquiry: ${data.name} — ${data.project}`)
    .setHtml(buildHtml(data))
    .setText(
      [
        `New enquiry for ${siteConfig.name}`,
        "",
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Phone: ${data.phone || "—"}`,
        `Project: ${data.project}`,
        `Budget: ${data.budget || "—"}`,
        "",
        data.message,
      ].join("\n")
    );

  try {
    await mailersend.email.send(emailParams);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MailerSend send failed";
    console.error("[MailerSend] contact notification failed:", message);
    return { ok: false, error: message };
  }
}
