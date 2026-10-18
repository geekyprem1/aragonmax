// Front-end PDF bonuses shown on /bonuses to every logged-in buyer.
// Each `url` currently points to the shared Drive folder. To link a single PDF,
// replace it with that file's share link. Empty url = shows "Coming soon".

export const BONUS_FOLDER_URL =
  "https://drive.google.com/drive/folders/1V5SH-EmKZUjTmaUBWkbJGkgtAo1D7NRN?usp=sharing";
export const SUPPORT_EMAIL = "hello@psquare.online";

export interface Bonus {
  id: number;
  title: string;
  value: string;
  pages: string;
  desc: string;
  url: string;
}

export const BONUSES: Bonus[] = [
  {
    id: 1,
    title: "ArgonMax 30-Minute Quick-Start Guide",
    value: "$47",
    pages: "20–30 pages",
    desc: "A simple illustrated PDF that shows you exactly how to create your first content, code, or creative asset without guessing.",
    url: BONUS_FOLDER_URL,
  },
  {
    id: 2,
    title: "300+ Prompt-to-Profit Workflow Vault",
    value: "$67",
    pages: "100–150 pages",
    desc: "One searchable PDF packed with ready-to-use workflows for content, ads, clients, code, and more.",
    url: BONUS_FOLDER_URL,
  },
  {
    id: 3,
    title: "30-Day Content & Campaign Calendar",
    value: "$47",
    pages: "35–45 pages",
    desc: "A day-by-day PDF action plan with matching prompts so you never have to wonder what to create next.",
    url: BONUS_FOLDER_URL,
  },
  {
    id: 4,
    title: "AI Client-Getter Agency Starter Kit",
    value: "$97",
    pages: "50–70 pages",
    desc: "Service ideas, outreach scripts, proposal copy, client onboarding, and fulfillment workflows in one practical PDF.",
    url: BONUS_FOLDER_URL,
  },
  {
    id: 5,
    title: "Creative Studio Image & Video Prompt Pack",
    value: "$67",
    pages: "60–80 pages",
    desc: "200 prompts for product shots, ad creatives, thumbnails, Reels, social posts, and short videos. Generating images/videos requires Creative Studio access and credits.",
    url: BONUS_FOLDER_URL,
  },
];
