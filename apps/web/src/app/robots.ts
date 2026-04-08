import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/onboarding/", "/dashboard/", "/auth/"],
      },
    ],
    sitemap: "https://vibr-ai.com/sitemap.xml",
  };
}
