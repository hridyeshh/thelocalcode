import type { Metadata } from "next";
import { Bricolage_Grotesque, Fraunces, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Fraunces with its soft corners for display (warm, a little retro, like the computer);
// Bricolage Grotesque for reading, with some hand-made character of its own.
const serif = Fraunces({ subsets: ["latin"], variable: "--font-serif", style: ["normal", "italic"], axes: ["SOFT", "WONK", "opsz"] });
const sans = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-sans", axes: ["opsz"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const description =
  "Websites and internet branding for founders and local businesses, from a two-person studio in Bengaluru that ships real products: web apps, a browser extension and hardware.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "thelocalcode — websites and branding",
  description,
  openGraph: { title: "thelocalcode", description, images: ["/art/mac.webp"] },
};

const LD = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: "thelocalcode",
  description,
  areaServed: "IN",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body>
        <a href="#contact" className="skip">
          Skip the story and get in touch
        </a>
        <header className="nav">
          <a href="#top" className="nav-logo">
            thelocalcode
          </a>
          <nav className="nav-links" aria-label="Sections">
            <a href="#work">Work</a>
            <a href="#hardware">Hardware</a>
            <a href="#process">Process</a>
            <a href="#plans">Plans</a>
          </nav>
          <a href="#contact" className="btn btn-ink">
            Work with us
          </a>
        </header>
        <main>{children}</main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(LD) }} />
      </body>
    </html>
  );
}
