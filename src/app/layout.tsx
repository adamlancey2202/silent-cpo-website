import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans, JetBrains_Mono } from "next/font/google";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { isPreviewDeployment } from "@/lib/indexing";
import { getActiveGa4MeasurementId } from "@/lib/site-settings";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#081F2C",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.seoTitle,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.name, url: siteConfig.url }],
  creator: siteConfig.name,
  publisher: siteConfig.name,
  formatDetection: {
    email: true,
    telephone: true,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteConfig.seoTitle,
    description: siteConfig.description,
    images: [
      {
        url: "/images/blog-image.png",
        width: 1024,
        height: 576,
        alt: "SilentCPO — Digital Product Studio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seoTitle,
    description: siteConfig.description,
    images: ["/images/blog-image.png"],
  },
  robots: {
    index: !isPreviewDeployment,
    follow: true,
    googleBot: {
      index: !isPreviewDeployment,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
  category: "technology",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const ga4MeasurementId = await getActiveGa4MeasurementId();

  return (
    <html
      lang="en-GB"
      className={`${bebas.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <head>
        <link rel="icon" href="/images/logo.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/images/logo.jpg" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="About SilentCPO" />
      </head>
      <body>
        {children}
        {!isPreviewDeployment && <AnalyticsScripts measurementId={ga4MeasurementId} />}
      </body>
    </html>
  );
}
