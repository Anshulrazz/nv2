import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Notexia",
    short_name: "Notexia",
    description: "Smart Notes, AI Chat & Study Community for Students",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0c12",
    theme_color: "#06b6d4",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    lang: "en",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
