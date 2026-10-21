// Every word on the site lives here. Edit copy here, not in the components.

export const STUDIO = "thelocalcode";

/** The line the camera dives into on the computer's screen, and Desky's chapter opens on. */
export const INTRO = "Here's what we've built";

export const SITES = [
  {
    slug: "paperboxd",
    name: "PaperBoxd",
    url: "https://paperboxd.in",
    line: "A social network for readers: track, rate and share the books you love.",
    did: ["Web app", "iOS + Android", "Backend", "Brand"],
  },
  {
    slug: "stickynotes",
    name: "stickynotes",
    url: "https://stickynotes.in",
    line: "A browser extension that keeps highlights from any page, filed by topic. Painted by hand, page by page.",
    did: ["Chrome extension", "Web library", "Go API", "Brand + art"],
  },
  {
    slug: "circuitsupport",
    name: "CircuitSupport",
    url: "https://www.circuitsupport.com",
    line: "3D printing, project kits and CAD help for engineering students in Bengaluru.",
    did: ["Storefront", "Order flow", "Brand", "SEO"],
  },
] as const;

export const HARDWARE = {
  desky: {
    n: "01",
    name: "Desky",
    status: "Working",
    line: "A retro desk display: three little screens on a Raspberry Pi. Drag a widget onto a screen in its iPhone app and the screen changes in about five seconds.",
    specs: ["Raspberry Pi Zero 2W", "3 × SPI screens", "Go API", "iPhone app"],
    can: ["Clock", "Weather", "Now playing", "Timer", "Quotes", "GIFs", "A pixel pet", "Alarms", "Desk lamp"],
  },
  butterfly: {
    n: "02",
    name: "Butterfly clutcher",
    status: "In the workshop",
    line: "A hair clip with wings. Move your head and it flaps: an accelerometer feels the motion and a micro servo moves the wings.",
    specs: ["ESP32-C3 Super Mini", "ADXL345", "SG90 servo", "LiPo + USB-C"],
  },
  keychain: {
    n: "03",
    name: "Pixel keychain",
    status: "In the workshop",
    line: "An ESP32 on your keys with a tiny screen. A pixel cat lives in it.",
    specs: ["ESP32", "Tiny screen", "Pixel world"],
  },
} as const;

// What's inside each device, in the order its exploded view shows the parts.
// Desky's come from its pin map (docs/pin-map.md in the desky repo).
export const DESKY_PARTS = [
  { title: "3 × ILI9341 screens.", detail: "240 × 320 each, driven over SPI." },
  { title: "Raspberry Pi Zero 2W.", detail: "Draws every widget in Python, and asks our Go API what to show every 5 seconds." },
  { title: "The wiring.", detail: "SPI0 runs screens 1 and 2, SPI1 runs screen 3, one PWM pin dims all three." },
] as const;
export const BUTTERFLY_PARTS = [
  { title: "ESP32-C3 Super Mini.", detail: "The brain, smaller than a stamp." },
  { title: "ADXL345.", detail: "Feels your head move, on three axes." },
  { title: "SG90 micro servo.", detail: "Flaps the wings." },
  { title: "LiPo + USB-C.", detail: "Charges like your phone." },
] as const;
export const KEYCHAIN_PARTS = [
  { title: "A tiny colour screen.", detail: "The cat lives here." },
  { title: "ESP32.", detail: "Draws the pixel world, frame by frame." },
  { title: "LiPo cell.", detail: "Charges over USB-C." },
] as const;

/** Desky's real widgets, as its iPhone app names them. The screens cycle through these sets. */
export const DESKY_SETS = [
  ["clock", "weather", "music"],
  ["pet", "gif", "timer"],
] as const;

export const PROBLEM_ROTATOR = [
  "a brand that looks like you",
  "pages that load in a blink",
  "words that sound human",
  "proof that you're real",
] as const;

export const ORBIT_ICONS = ["</>", "Aa", "★", "@", "◐", "#", "▲", "✉", "◎", "⌘"] as const;

export const STEPS = [
  {
    n: "01",
    tab: "Understand",
    tone: "yellow",
    lead: "First, we learn your business.",
    lines: ["Who you sell to.", "What makes you different.", "What isn't working.", "Who you're up against."],
    close: ["All studied.", "All written down.", "In one call."],
  },
  {
    n: "02",
    tab: "Design & build",
    tone: "purple",
    lead: "Then we design and build it.",
    lines: ["Logo. Colours. Type.", "Words that sound like you.", "A fast, mobile-first site."],
    close: ["Built like a product,", "not a template."],
  },
  {
    n: "03",
    tab: "Launch & grow",
    tone: "green",
    lead: "Then we launch, and stay.",
    lines: ["Domain and hosting.", "Google Business.", "Enquiries on WhatsApp.", "Analytics."],
    close: ["All set up.", "And we're around for updates."],
  },
] as const;

export const NOTES = [
  { icon: "◎", title: "Domain connected", sub: "yourbusiness.in points to your new site" },
  { icon: "✓", title: "Secure", sub: "https is on" },
  { icon: "▲", title: "Deployed", sub: "Your site is live" },
  { icon: "✉", title: "New enquiry from your website", sub: "“Can we start next week?”" },
] as const;

/** The old way: one cable through five vendors, knotted. The new way: one straight line. */
export const TANGLE = {
  before: "Getting online usually means five vendors.",
  after: "With us, it's one straight line.",
  vendors: ["designer", "developer", "hosting", "SEO agency", "social media"],
  you: "you",
} as const;

// One step per chip on our board, in the order they light up.
export const INSIDE = [
  {
    tone: "pink",
    chip: "LEARN",
    note: "First, we learn everything about your business.",
    tags: ["Your customers", "Competitors", "Your offers", "Brand voice", "Goals", "Local market"],
  },
  {
    tone: "yellow",
    chip: "BRAND",
    note: "Then we shape a brand that looks like you.",
    tags: ["Logo", "Colours", "Type", "Tone of voice", "Photo style", "Social kit"],
  },
  {
    tone: "green",
    chip: "BUILD",
    note: "We build it like a product, not a template.",
    tags: ["Next.js", "Fast on 4G", "SEO", "Mobile first", "Analytics", "Accessible"],
  },
  {
    tone: "purple",
    chip: "CARE",
    note: "And we don't disappear after launch.",
    tags: ["Hosting", "Updates", "Google Business", "Instagram", "WhatsApp", "Reports"],
  },
] as const;

export const PLANS = {
  included: [
    "Design and build",
    "Mobile-first and fast",
    "Domain, hosting and email setup",
    "SEO basics + Google Business",
    "Enquiries to your inbox and WhatsApp",
    "Help after launch",
  ],
  tiers: [
    { name: "Launch", tone: "ink", for: "New businesses and freelancers", line: "A one-page site that makes you look established from day one." },
    { name: "Brand", tone: "yellow", for: "Businesses ready to grow online", line: "A full website plus identity: logo, colours, type and a social kit." },
    { name: "Build", tone: "purple", for: "Founders with something new", line: "Custom web apps, online stores, or a hardware prototype." },
  ],
} as const;

// PLACEHOLDERS: swap these for real client quotes before launch, or remove <Proof />.
export const QUOTES = [
  { text: "Our customers keep asking which agency we hired.", who: "Client name", role: "Café owner" },
  { text: "They understood the business in one call.", who: "Client name", role: "Founder" },
  { text: "Finally a website I'm proud to send people to.", who: "Client name", role: "Studio owner" },
  { text: "Enquiries now land on WhatsApp, straight from the site.", who: "Client name", role: "Clinic manager" },
  { text: "Fast, friendly, and they explain everything.", who: "Client name", role: "Shop owner" },
  { text: "The new logo alone was worth it.", who: "Client name", role: "Co-founder" },
] as const;
