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

function mailer(): MailerSend {
  return new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY!,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function strategyCallUrl(): string | null {
  const raw = process.env.STRATEGY_CALL_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    return url.toString();
  } catch {
    return null;
  }
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

  const mailersend = mailer();

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

export type NewsletterSignupEmail = {
  email: string;
  name: string | null;
  source: string | null;
  unsubscribeToken: string;
};

function welcomeHtml(data: NewsletterSignupEmail): string {
  const greeting = data.name ? `Hi ${escapeHtml(data.name)},` : "Hi,";
  const booking = strategyCallUrl();
  const callBlock = booking
    ? `<p style="margin:24px 0"><a href="${escapeHtml(booking)}" style="display:inline-block;background:#b89a62;color:#081f2c;text-decoration:none;padding:12px 18px;font-size:14px">Book your strategy call</a></p>`
    : `<p style="margin:16px 0 0;font-size:15px;line-height:1.6;color:#f2ebdd">Reply to this email and tell me what you're working on. I'll send a couple of times for a free 30-minute strategy call.</p>`;
  const unsubscribe = `${siteConfig.url}/newsletter/unsubscribe?token=${encodeURIComponent(data.unsubscribeToken)}`;

  return `
    <div style="background:#081f2c;padding:32px 16px;font-family:system-ui,sans-serif">
      <div style="max-width:560px;margin:0 auto;background:#102a43;padding:32px;color:#f2ebdd">
        <p style="margin:0;letter-spacing:0.16em;font-size:12px;color:#b89a62">SILENTCPO</p>
        <h1 style="margin:16px 0 0;font-size:28px;font-weight:500;color:#f2ebdd">You're on the list.</h1>
        <p style="margin:20px 0 0;font-size:15px;line-height:1.6">${greeting}</p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6">Thanks for signing up. I'll email you when a new post goes live.</p>
        <p style="margin:12px 0 0;font-size:15px;line-height:1.6">Your signup includes a free 30-minute strategy call.</p>
        ${callBlock}
        <p style="margin:32px 0 0;font-size:12px;line-height:1.5;color:#dce7ed">Don't want these emails? <a href="${unsubscribe}" style="color:#b89a62">Unsubscribe</a>.</p>
      </div>
    </div>
  `.trim();
}

function welcomeText(data: NewsletterSignupEmail): string {
  const greeting = data.name ? `Hi ${data.name},` : "Hi,";
  const booking = strategyCallUrl();
  const callLine = booking
    ? `Book your free 30-minute strategy call: ${booking}`
    : "Reply to this email and tell me what you're working on. I'll send a couple of times for a free 30-minute strategy call.";
  return [
    greeting,
    "",
    "Thanks for signing up. I'll email you when a new post goes live.",
    "",
    "Your signup includes a free 30-minute strategy call.",
    callLine,
    "",
    `Unsubscribe: ${siteConfig.url}/newsletter/unsubscribe?token=${data.unsubscribeToken}`,
  ].join("\n");
}

export async function sendNewsletterSignupEmails(
  data: NewsletterSignupEmail
): Promise<{ ok: boolean; error?: string }> {
  if (!isMailerSendConfigured()) {
    return { ok: false, error: "MailerSend not configured" };
  }

  const fromEmail = process.env.MAILERSEND_FROM_EMAIL!.trim();
  const owner = notifyEmail();
  const displayName = data.name || data.email;
  const client = mailer();

  const welcome = new EmailParams()
    .setFrom(new Sender(fromEmail, fromName()))
    .setTo([new Recipient(data.email, displayName)])
    .setReplyTo(new Recipient(owner, fromName()))
    .setSubject("You're subscribed — your strategy call is included")
    .setHtml(welcomeHtml(data))
    .setText(welcomeText(data));

  const notice = new EmailParams()
    .setFrom(new Sender(fromEmail, fromName()))
    .setTo([new Recipient(owner, siteConfig.name)])
    .setReplyTo(new Recipient(data.email, displayName))
    .setSubject(`Newsletter signup: ${data.email}`)
    .setHtml(
      `
      <div style="font-family:system-ui,sans-serif;max-width:560px">
        <h2 style="color:#102A43;margin:0 0 16px">New newsletter signup</h2>
        <p style="margin:0;font-size:14px;color:#111">Name: ${escapeHtml(data.name || "—")}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#111">Email: ${escapeHtml(data.email)}</p>
        <p style="margin:8px 0 0;font-size:14px;color:#111">Source: ${escapeHtml(data.source || "—")}</p>
      </div>
    `.trim()
    )
    .setText(
      [
        "New newsletter signup",
        "",
        `Name: ${data.name || "—"}`,
        `Email: ${data.email}`,
        `Source: ${data.source || "—"}`,
      ].join("\n")
    );

  try {
    await Promise.all([client.email.send(welcome), client.email.send(notice)]);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "MailerSend send failed";
    console.error("[MailerSend] newsletter signup failed:", message);
    return { ok: false, error: message };
  }
}

export async function sendProjectReply(data: {
  to: string;
  title: string;
  reply: string;
  listingUrl: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isMailerSendConfigured()) {
    return { ok: false, error: "MailerSend not configured" };
  }

  const fromEmail = process.env.MAILERSEND_FROM_EMAIL!.trim();
  const owner = notifyEmail();
  const subject = data.title.slice(0, 80);
  const text = [data.reply, "", listingLine(data.listingUrl)].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#111;font-size:15px;line-height:1.6">
      ${escapeHtml(data.reply).replace(/\n/g, "<br>")}
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280">${escapeHtml(listingLine(data.listingUrl))}</p>
    </div>
  `.trim();

  try {
    await mailer().email.send(
      new EmailParams()
        .setFrom(new Sender(fromEmail, fromName()))
        .setTo([new Recipient(data.to)])
        .setReplyTo(new Recipient(owner, fromName()))
        .setSubject(subject)
        .setHtml(html)
        .setText(text)
    );
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "MailerSend send failed";
    console.error("[MailerSend] project reply failed:", message);
    return { ok: false, error: message };
  }
}

function listingLine(url: string): string {
  return `Listing: ${url}`;
}
