import type { Metadata } from "next";
import { Geist, Geist_Mono, Hanken_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
import "./globals.css";
import { getLocale, dict } from "@/lib/i18n";
import { I18nProvider } from "@/lib/i18n-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Editorial display/body font for the marketing homepage — a free neo-grotesque
// stand-in for Tourism NZ's custom "National / Pure Pākati" (Klim, commercial),
// emulating the newzealand.com look. Scoped via the --font-hanken variable; the
// home page opts in, the rest of the app keeps Geist.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.libretour.com"),
  title: "Libretour — NZ Tourism B2B Training",
  description:
    "Learn directly from New Zealand tourism operators. Get verifiable digital badges. Ask AI anything — in any language.",
  openGraph: {
    title: "Libretour — NZ Tourism B2B Training",
    description:
      "Learn directly from New Zealand tourism operators. Get verifiable digital badges. Ask AI anything — in any language.",
    url: "https://www.libretour.com",
    siteName: "Libretour",
    images: [{ url: "/og-default.png", width: 1200, height: 1200, alt: "Libretour" }],
    locale: "en_NZ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Libretour — NZ Tourism B2B Training",
    description:
      "Learn directly from New Zealand tourism operators. Get verifiable digital badges. Ask AI anything — in any language.",
    images: ["/og-default.png"],
  },
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
        <body className={`${geistSans.variable} ${geistMono.variable} ${hankenGrotesk.variable} antialiased`}>
          <I18nProvider tr={dict[locale]}>{children}</I18nProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
