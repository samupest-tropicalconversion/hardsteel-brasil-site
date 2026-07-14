import type { Metadata } from "next";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/ibm-plex-mono/400.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hardsteel Brasil | Casas em steel frame",
  description: "Casas autorais em steel frame, fabricadas com precisão milimétrica e entregues no prazo de meses.",
  keywords: ["steel frame", "casa A-frame", "casa pré-fabricada", "arquitetura autoral", "Cotia"],
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Hardsteel Brasil | Precisão de fábrica para morar",
    description: "Configure sua casa em steel frame e receba uma estimativa inicial de área, prazo e investimento.",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Hardsteel Brasil",
    description: "Casas em steel frame com arquitetura autoral e precisão de fábrica.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
