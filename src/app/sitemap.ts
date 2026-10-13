import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/data";
import { siteUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const posts = await getPublishedPosts();
  return [
    { url: base },
    ...["blog", "events", "officers", "resources", "about"].map((p) => ({ url: `${base}/${p}` })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updated_at })),
  ];
}
