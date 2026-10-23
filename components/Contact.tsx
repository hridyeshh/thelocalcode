"use client";

import { useActionState } from "react";
import { type SendState, sendContact } from "@/app/actions";
import { NEEDS } from "@/lib/contact";
import { STUDIO } from "@/lib/content";

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;

export function Contact() {
  const [state, action, pending] = useActionState<SendState, FormData>(sendContact, { status: "idle" });
  const whatsapp = WHATSAPP
    ? `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi ${STUDIO}, I'd like a website for my business.`)}`
    : null;
  return (
    <footer id="contact" className="contact">
      <div className="contact-grid">
        <div className="contact-intro">
          <p className="eyebrow">Get in touch</p>
          <h2 className="contact-title">
            <span className="tape">Tell us what</span>
            <br />
            <span className="tape">
              you&apos;re <em>building</em>.
            </span>
          </h2>
          <p>Pricing depends on what you need, so let&apos;s talk first. Send a few lines here or message us on WhatsApp.</p>
          {whatsapp && (
            <a className="btn btn-mint" href={whatsapp} target="_blank" rel="noopener">
              Chat on WhatsApp
            </a>
          )}
        </div>
        {/* The form, as a window on the computer from the story. */}
        <div className="window">
          <p className="window-bar" aria-hidden>
            <span className="window-close" />
            <span className="window-title">new-project.txt</span>
          </p>
          <form action={action} className="form">
            <div className="form-row">
              <label className="field">
                <span>Your name</span>
                <input name="name" required maxLength={80} autoComplete="name" />
              </label>
              <label className="field">
                <span>Email or phone</span>
                <input name="reach" required maxLength={120} autoComplete="email" />
              </label>
            </div>
            <fieldset className="field">
              <legend>What do you need?</legend>
              <div className="needs">
                {NEEDS.map((n, i) => (
                  <label key={n} className="need">
                    <input type="radio" name="need" value={n} defaultChecked={i === 0} />
                    <span>{n}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>About the project</span>
              <textarea name="message" required minLength={10} maxLength={2000} rows={5} placeholder="A few lines is plenty." />
            </label>
            <div className="hp" aria-hidden>
              <label>
                Leave this empty
                <input name="company_url" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            <div className="form-foot">
              <button className="btn btn-ink btn-send" disabled={pending}>
                {pending ? "Sending…" : "Send it ↗"}
              </button>
              <p className={`form-status ${state.status}`} role="status">
                {state.status === "sent" ? "Got it. We'll be in touch soon." : state.message}
              </p>
            </div>
          </form>
        </div>
      </div>
      <div className="footer">
        <p className="wordmark" aria-hidden>
          thelocalcode
        </p>
        <div className="footer-row">
          <span>© {new Date().getFullYear()} thelocalcode</span>
          <span>Websites · Branding · Hardware</span>
        </div>
      </div>
    </footer>
  );
}
