export const DEMO_ORG = "Apex Fabrication";

export type DemoView =
  | "dashboard"
  | "welders"
  | "profile"
  | "qualify"
  | "masterlist"
  | "verify"
  | "email-inbox"
  | "email-message";

export const DEMO_PATHS: Record<DemoView, string> = {
  dashboard: "welddoc.in/dashboard",
  welders: "welddoc.in/welders",
  profile: "welddoc.in/welders/j-morrison",
  qualify: "welddoc.in/welders/j-morrison/qualify",
  masterlist: "welddoc.in/welders/masterlist",
  verify: "welddoc.in/verify/demo",
  "email-inbox": "mail.google.com/mail/u/0/#inbox",
  "email-message": "mail.google.com/mail/u/0/#inbox/FM…",
};

export type DemoNav = "dashboard" | "welders" | "masterlist";

export const DEMO_NAV_FOR_VIEW: Record<DemoView, DemoNav | null> = {
  dashboard: "dashboard",
  welders: "welders",
  profile: "welders",
  qualify: "welders",
  masterlist: "masterlist",
  verify: null,
  "email-inbox": null,
  "email-message": null,
};

export type TimelineEvent =
  | { type: "wait"; ms: number }
  | { type: "move"; target: string; ms?: number }
  | { type: "click" }
  | { type: "view"; view: DemoView }
  | { type: "qualifyStep"; step: number }
  | { type: "highlight"; target: string | null }
  | { type: "url"; path: string }
  | { type: "verifyReveal" };

/** Targets must exist as `[data-demo-target="…"]` inside the demo stage. */
export const DEMO_TIMELINE: TimelineEvent[] = [
  { type: "wait", ms: 900 },
  { type: "move", target: "nav-welders", ms: 1000 },
  { type: "highlight", target: "nav-welders" },
  { type: "wait", ms: 320 },
  { type: "click" },
  { type: "view", view: "welders" },
  { type: "url", path: DEMO_PATHS.welders },
  { type: "highlight", target: null },
  { type: "wait", ms: 450 },
  { type: "move", target: "view-row-0", ms: 900 },
  { type: "highlight", target: "view-row-0" },
  { type: "wait", ms: 280 },
  { type: "click" },
  { type: "view", view: "profile" },
  { type: "url", path: DEMO_PATHS.profile },
  { type: "highlight", target: null },
  { type: "wait", ms: 550 },
  { type: "move", target: "qualify-btn", ms: 900 },
  { type: "highlight", target: "qualify-btn" },
  { type: "wait", ms: 260 },
  { type: "click" },
  { type: "view", view: "qualify" },
  { type: "url", path: DEMO_PATHS.qualify },
  { type: "qualifyStep", step: 1 },
  { type: "highlight", target: null },
  { type: "wait", ms: 700 },
  { type: "move", target: "qualify-continue", ms: 750 },
  { type: "click" },
  { type: "qualifyStep", step: 2 },
  { type: "wait", ms: 700 },
  { type: "move", target: "qualify-continue", ms: 650 },
  { type: "click" },
  { type: "qualifyStep", step: 3 },
  { type: "wait", ms: 700 },
  { type: "move", target: "qualify-continue", ms: 650 },
  { type: "click" },
  { type: "qualifyStep", step: 4 },
  { type: "wait", ms: 1100 },
  { type: "view", view: "verify" },
  { type: "url", path: DEMO_PATHS.verify },
  { type: "wait", ms: 500 },
  { type: "move", target: "verify-qr", ms: 900 },
  { type: "wait", ms: 2000 },
  { type: "verifyReveal" },
  { type: "wait", ms: 3600 },
  { type: "view", view: "dashboard" },
  { type: "url", path: DEMO_PATHS.dashboard },
  { type: "wait", ms: 500 },
  { type: "view", view: "email-inbox" },
  { type: "url", path: DEMO_PATHS["email-inbox"] },
  { type: "wait", ms: 550 },
  { type: "move", target: "email-inbox-item", ms: 900 },
  { type: "highlight", target: "email-inbox-item" },
  { type: "wait", ms: 300 },
  { type: "click" },
  { type: "view", view: "email-message" },
  { type: "url", path: DEMO_PATHS["email-message"] },
  { type: "highlight", target: null },
  { type: "wait", ms: 450 },
  { type: "move", target: "email-section-expiring", ms: 850 },
  { type: "wait", ms: 2200 },
];
