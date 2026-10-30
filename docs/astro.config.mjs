import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

export default defineConfig({
  integrations: [starlight({
    title: "Explainer",
    description: "Markdown into books, interactive tutors, and narrated videos.",
    social: [{ icon: "github", label: "GitHub", href: "https://github.com/rikurb8/explainer" }],
    editLink: { baseUrl: "https://github.com/rikurb8/explainer/edit/main/docs/" },
    customCss: ["./src/styles/custom.css"],
    sidebar: [
      { label: "Start here", items: ["index", "getting-started", "playground"] },
      { label: "Make something", items: ["books", "walkthroughs", "videos", "review-loop"] },
      { label: "Maintain", items: ["editing-docs"] },
    ],
  })],
});
