import { Montserrat, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

const montserrat = Montserrat({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lumena",
    template: "%s | Lumena",
  },
  description:
    "Systemized content and human strategy for medical specialists who want consistent social, content, and web growth.",
  keywords: [
    "medical marketing",
    "medical branding",
    "content strategy",
    "social media for doctors",
    "healthcare growth",
    "medical specialists",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Lumena",
    title: "Lumena",
    description:
      "Systemized content and human strategy for medical specialists who want consistent social, content, and web growth.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumena",
    description:
      "Systemized content and human strategy for medical specialists who want consistent social, content, and web growth.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${montserrat.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
