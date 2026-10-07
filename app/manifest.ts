import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "PolicyBoard",
    short_name: "PolicyBoard",
    description: "Sales goals and production for the team",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#065f46",
    icons: [
      { src: "/icons/mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
