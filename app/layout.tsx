// For adding custom fonts with other frameworks, see:
// https://tailwindcss.com/docs/font-family
import type { Metadata } from "next";
import { Antic, Lora, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const fontSans = Antic({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontSerif = Lora({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
});

const fontMono = JetBrains_Mono({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "OpenAux",
  description: "Open Aux platform for hosts, participants, listeners, and voters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <Script id="theme-init" strategy="beforeInteractive">
        {`(() => {
  try {
    const stored = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "light" || stored === "dark" ? stored : (systemDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch {
    // no-op
  }
})();`}
      </Script>
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}