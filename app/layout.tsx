import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Analytics from "@/components/Analytics";
import { SettingsProvider } from "@/components/SettingsProvider";
import FloatingChat from "@/components/FloatingChat";
import JsonLd from "@/components/JsonLd";
import { createClient } from '@supabase/supabase-js';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Create a single supabase client for fetching config similarly to lib/supabase but for server component use
// We can use the library one if it was just a simple import, but let's be safe and use direct init if needed
// Actually, let's use the env vars directly since we are on server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function getAnalyticsConfig() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.from('ai_config').select('*').in('key', ['google_analytics_id', 'facebook_pixel_id', 'tiktok_pixel_id', 'google_ads_id']);

    const config: Record<string, string> = {};
    data?.forEach((row: any) => { config[row.key] = row.value; });

    return {
      googleAnalyticsId: config.google_analytics_id,
      facebookPixelId: config.facebook_pixel_id,
      tiktokPixelId: config.tiktok_pixel_id,
      googleAdsId: config.google_ads_id
    };
  } catch (e) {
    console.error('Failed to fetch analytics config:', e);
    return {};
  }
}

async function getSettings() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data } = await supabase.from('ai_config').select('*');

    const settings: Record<string, string> = {};
    data?.forEach((row: any) => { settings[row.key] = row.value; });

    return settings;
  } catch (e) {
    console.error('Failed to fetch settings:', e);
    return {};
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();

  const title = settings.seo_title || "SignsHaus — Premium Signage Maker in Metro Manila";
  const description = settings.seo_description || "Professional signage fabrication & installation in Metro Manila. Acrylic build-up, stainless steel, LED neon, panaflex lightbox. Free ocular inspection. Get a quote today!";
  const ogImage = settings.seo_og_image || "/images/og-image.jpg";
  const favicon = settings.site_favicon || "/logo-web.png";

  return {
    title: {
      default: title,
      template: `%s | ${settings.company_name || 'SignsHaus'}`,
    },
    description: description,
    keywords: settings.seo_keywords ? settings.seo_keywords.split(',').map(k => k.trim()) : [
      "signage maker Manila",
      "acrylic signage Philippines",
      "stainless steel letters",
      "LED neon signs",
      "panaflex signage",
      "building signage Metro Manila",
    ],
    icons: {
      icon: [
        { url: favicon, href: favicon },
      ],
      shortcut: [
        { url: favicon, href: favicon },
      ],
      apple: [
        { url: favicon, href: favicon },
      ],
    },
    openGraph: {
      title: title,
      description: description,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: "website",
      locale: "en_PH",
      siteName: settings.company_name || "SignsHaus",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsConfig = await getAnalyticsConfig();
  const settings = await getSettings();

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased font-[family-name:var(--font-inter)]`}>
        <Suspense>
          <SettingsProvider initialSettings={settings}>
            <Analytics {...analyticsConfig} />
            <JsonLd />
            {children}
            <FloatingChat />
          </SettingsProvider>
        </Suspense>
      </body>
    </html>
  );
}
