import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ScamShield AI",
    short_name: "ScamShield",
    description: "Terminal3-protected fraud detection for links, scam messages, QR payloads, and uploaded evidence.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
