"use server";

import { parseContact } from "@/lib/contact";

export type SendState = { status: "idle" | "sent" | "error"; message?: string };

const FALLBACK = "Couldn't send that right now. WhatsApp us instead.";

export async function sendContact(_prev: SendState, form: FormData): Promise<SendState> {
  const parsed = parseContact(form);
  if ("spam" in parsed) return { status: "sent" }; // don't tell bots they were caught
  if (!parsed.ok) return { status: "error", message: parsed.error };

  const key = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  if (!key || !to) {
    console.error("contact: RESEND_API_KEY or CONTACT_TO_EMAIL is not set");
    return { status: "error", message: FALLBACK };
  }

  const { name, reach, need, message } = parsed.data;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.CONTACT_FROM_EMAIL ?? "thelocalcode <onboarding@resend.dev>",
      to: [to],
      ...(reach.includes("@") ? { reply_to: reach } : {}),
      subject: `New enquiry: ${need} — ${name}`,
      text: `${name}\n${reach}\nNeeds: ${need}\n\n${message}`,
    }),
  });
  if (!res.ok) {
    console.error("contact: Resend rejected the email", res.status, await res.text());
    return { status: "error", message: FALLBACK };
  }
  return { status: "sent" };
}
