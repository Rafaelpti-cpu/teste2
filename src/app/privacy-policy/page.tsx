import type { Metadata } from "next";

import { generateMetadata as buildMetadata } from "@/utils/seo/generate-page-metadata";
import { PrivacyView } from "@/views/privacidade";

export const metadata: Metadata = buildMetadata({
  title: "Política de privacidade · Renova Closet",
  description:
    "Como a Renova Closet trata os dados de quem visita o site e fala com a loja pelo WhatsApp.",
  url: "/privacy-policy",
});

export default function PrivacyPolicyPage() {
  return <PrivacyView />;
}
