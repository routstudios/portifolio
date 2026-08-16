import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Syne } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space", display: "swap" });
const syne = Syne({ subsets: ["latin"], variable: "--font-syne", display: "swap" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://routstudios.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "ROUT STUDIOS — Find a better route",
  description: "Estúdio digital de Redzzz e ToutCZ. Criamos sites, interfaces, aplicações web e soluções com IA.",
  keywords: ["web design","web development","landing pages","web apps","AI","Rout Studios"],
  authors: [{ name: "Rout Studios" }],
  openGraph: { title: "ROUT STUDIOS — Find a better route", description: "Ideas move faster when they have the right route.", type: "website", locale: "pt_BR", siteName: "Rout Studios", images: [{ url: "/og.png", alt: "ROUT. Find a better route." }] },
  twitter: { card: "summary_large_image", title: "ROUT STUDIOS — Find a better route", description: "Ideas move faster when they have the right route.", images: ["/og.png"] },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = { themeColor: "#0a0a09", colorScheme: "dark" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR" className={`${spaceGrotesk.variable} ${syne.variable}`}><body>{children}</body></html>;
}
