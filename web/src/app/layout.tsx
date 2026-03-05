import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Engineer Roadmap — Job Market Intelligence",
  description:
    "Data-driven intelligence on the AI engineering job market. Real skills, real salaries, real postings.",
  keywords: [
    "AI engineering",
    "LLM",
    "RAG",
    "salary data",
    "machine learning jobs",
    "roadmap",
  ],
  openGraph: {
    title: "AI Engineer Roadmap",
    description: "Real job market data for AI engineers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
