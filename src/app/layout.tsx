import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AppContextProvider } from "../context/AppContext";
import NavbarWrapper from "@/components/navbar/NavbarWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solrise – Rise Through Every Problem",
  description:
    "Solrise is a competitive programming performance engine. Track progress, sharpen weaknesses, and climb the ranks with precision analytics and structured practice.",
  keywords: [
    "Solrise",
    "Competitive Programming",
    "Codeforces Practice",
    "Problem Tracker",
    "Rating Progress",
    "CP Analytics",
    "Rank Progression",
    "Performance Engine",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300`}
        style={{ fontFamily: "var(--font-inter, var(--font-sans))" }}
      >
        <AppContextProvider>
          <div className="relative z-[1]">
            <NavbarWrapper />
            <div className="min-h-[calc(100vh-64px)]">{children}</div>
            <footer className="border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-[var(--text-muted)] text-center sm:text-left">
                    Designed &amp; Built by{" "}
                    <span className="font-semibold text-[var(--text-secondary)]">
                      Satish Kumar
                    </span>{" "}
                    &mdash; B.Tech CSE, IIIT Bhagalpur
                  </p>
                  <div className="flex items-center gap-3">
                    <a
                      href="https://github.com/Satish-011"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
                      title="GitHub"
                    >
                      <i className="fa-brands fa-github text-sm" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/satish-kumar-a48729324"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[#0a66c2] hover:bg-[var(--bg-tertiary)] transition-all"
                      title="LinkedIn"
                    >
                      <i className="fa-brands fa-linkedin text-sm" />
                    </a>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </AppContextProvider>
      </body>
    </html>
  );
}
