// All page content lives here. Edit this file to update the site.

export const site = {
  name: "Isaiah Boyd",
  url: "https://isaiahboyd.xyz",
  role: "Software engineer & game developer",
  location: "Palm Coast, Florida",
  timeZone: "America/New_York",
  email: "contact@isaiahboyd.xyz",
  description:
    "Isaiah Boyd is a software engineer and game developer in Palm Coast, Florida, working on VR/XR games, full stack development and AI.",
};

export const sections = [
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "projects", label: "Projects" },
  { id: "stack", label: "Stack" },
  { id: "beliefs", label: "Beliefs" },
  { id: "writing", label: "Writing" },
  { id: "contact", label: "Contact" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const about = [
  "I have been shipping updates and building products for more than four years: VR games with active player communities, open-source contributions and full stack development.",
  "Lately I spend a lot of time with AI. I build with coding agents, run local models and train language models on my own computer and home server.",
];

export type Role = {
  org: string;
  title: string;
  summary?: string;
  metric?: { value: string; label: string };
  links: { label: string; href: string }[];
};

export const work: Role[] = [
  {
    org: "Courtwork",
    title: "Founder & Developer · VR/XR",
    metric: { value: "3,100+", label: "all-time players" },
    links: [{ label: "Discord", href: "https://discord.gg/courtworkvr" }],
  },
  {
    org: "Ding Dong Ditch!",
    title: "Co-Founder & Developer · VR/XR",
    metric: { value: "2,600+", label: "all-time players" },
    links: [{ label: "Discord", href: "https://discord.gg/zruGSeWJGd" }],
  },
  {
    org: "Basketball Heroes",
    title: "Head Developer & Manager",
    summary:
      "Multiplayer VR basketball built in Unity. I work on gameplay, physics, multiplayer and interface, and coordinate development and beta testing.",
    metric: { value: "450+", label: "all-time players" },
    links: [{ label: "Discord", href: "https://discord.gg/q6u7HD52Wj" }],
  },
  {
    org: "Dusk Bot",
    title: "Software Engineer & Contributor",
    summary:
      "Open-source AI agents: a team of bots, each with its own memory and computer, running on your own models or existing AI subscriptions.",
    links: [
      { label: "dusk.bot", href: "https://dusk.bot" },
      { label: "GitHub", href: "https://github.com/DuskBotAI/duskbot" },
    ],
  },
];

export type Entry = { title: string; summary: string; meta: string; href?: string };

export const projects: Entry[] = [
  {
    title: "roblox-ai",
    summary: "More than 12,000 Roblox UI references for AI coding assistants to study when designing interfaces.",
    meta: "200+ stars",
    href: "https://github.com/isaiahagi/roblox-ai",
  },
  {
    title: "Brickyard",
    summary: "A control surface for building Roblox games with the AI coding agents you already use.",
    meta: "Beta",
    href: "https://brickyard.ch",
  },
  {
    title: "playhead-mcp",
    summary: "An MCP server that lets agents watch local video files, with change-aware filmstrips and synced speech.",
    meta: "Python",
    href: "https://github.com/isaiahagi/playhead-mcp",
  },
  {
    title: "Opcoda",
    summary: "A small AI model trained for coding in HTML, JavaScript, CSS and Python.",
    meta: "AI model",
    href: "https://opcoda.cc",
  },
  {
    title: "PRIMAL",
    summary: "A VR fan game inspired by Gorilla Tag. I am its founder.",
    meta: "VR",
  },
];

export const writing: Entry[] = [
  {
    title: "Learn AI",
    summary: "How I use coding agents, models and local AI to build games, websites and software.",
    meta: "Guide",
    href: "/learnai/",
  },
  {
    title: "Learn AI Pro",
    summary: "For people already comfortable with AI: tools, subagents, live benchmarks and training at home.",
    meta: "Guide",
    href: "/learnai/pro",
  },
];

export const stack: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["TypeScript", "JavaScript", "Python", "C#", "Rust"] },
  { group: "Web & app", items: ["Next.js", "React Native", "HTML", "CSS", "PostgreSQL"] },
  { group: "Games", items: ["Unity", "Unreal Engine", "Roblox Studio", "Blender", "VR/XR"] },
  { group: "AI", items: ["Claude Code", "Codex", "RAG", "JAX", "SGLang"] },
  { group: "Interests", items: ["Local models", "Model training", "Coding agents", "3D modeling"] },
];

// Distilled from the Learn AI guide in public/learnai.
export const beliefs: { title: string; note: string }[] = [
  {
    title: "A successful build is not a working product.",
    note: "Play the game yourself. An agent saying it fixed something does not make it true.",
  },
  {
    title: "Understand your own project.",
    note: "You do not need to be a senior engineer to make something cool, but knowing your own code saves you later.",
  },
  {
    title: "Core first, features second.",
    note: "Build one system at a time and get the actual gameplay working before anything extra.",
  },
  {
    title: "Use what works.",
    note: "No loyalty to one model or company. Benchmarks help, but testing on your own project decides.",
  },
  { title: "Just build stuff.", note: "Experiment, learn from it and keep going." },
];

export const socials: { label: string; handle: string; href: string }[] = [
  { label: "X", handle: "@IsaiahSrc", href: "https://x.com/IsaiahSrc" },
  { label: "TikTok", handle: "@izzyytech", href: "https://www.tiktok.com/@izzyytech" },
  { label: "GitHub", handle: "isaiahagi", href: "https://github.com/isaiahagi" },
];

export const discord = "isaiahbd";
