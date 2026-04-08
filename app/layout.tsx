import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Merriweather,
} from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/navigation/app-shell";
import { cn } from "@/lib/utils";

const merriweatherHeading = Merriweather({
  subsets: ["latin"],
  variable: "--font-heading",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kraken Trading Agent",
  description: "Paper-trading control room with live agent telemetry.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        jetbrainsMono.variable,
        merriweatherHeading.variable
      )}
      lang="en"
    >
      <body className="min-h-full bg-background text-foreground">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
