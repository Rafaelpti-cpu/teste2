import type { Metadata } from "next";

import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { HomeView } from "@/views/home";

export const metadata: Metadata = buildMetadata({
  title:
    "Renova Closet — Moda feminina, masculina, infantil e tênis em Santa Helena",
});

export default function Home() {
  return <HomeView />;
}
