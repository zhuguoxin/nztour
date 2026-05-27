import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import "./globals.css";
import { getLocale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Libretour — NZ Tourism B2B Training",
  description:
    "Learn directly from New Zealand tourism operators. Get verifiable digital badges. Ask AI anything — in any language.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // ClerkProvider's `localization` prop swaps every Clerk-rendered string
  // (sign-in form, modal labels, error messages, UserButton dropdown).
  // We pick zhCN when the user's cookie locale is zh-CN, else default English.
  const locale = await getLocale();
  return (
    <ClerkProvider localization={locale === "zh-CN" ? zhCN : undefined}>
      <html lang={locale === "zh-CN" ? "zh-CN" : "en"}>
        <head>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </head>
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
