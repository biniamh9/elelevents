import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Elel Events",
    short_name: "Elel Events",
    description: "Luxury decor booking CRM and event planning website.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6ede3",
    theme_color: "#ed7a30",
    icons: [
      {
        src: "/logo.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/logo.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
