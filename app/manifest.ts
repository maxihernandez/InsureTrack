import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Marianela Team Board",
    short_name: "Marianela Team Board",
    description: "Sales goals and production for the team",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fafafa",
    theme_color: "#ec0c21",
    icons: [
      { src: "/icon?brand=mt&v=2", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
