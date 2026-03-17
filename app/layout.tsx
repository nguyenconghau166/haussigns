import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { unstable_cache } from 'next/cache';
import { Suspense } from "react";
import Analytics from "@/components/Analytics";
import { SettingsProvider } from "@/components/SettingsProvider";
import FloatingChatLoader from '@/components/FloatingChatLoader';
import JsonLd from "@/components/JsonLd";
import { createClient } from '@supabase/supabase-js';
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const PUBLIC_CLIENT_SETTING_KEYS = new Set([
  'hero_title',
  'hero_subtitle',
  'hero_image',
  'company_name',
  'site_description',
  'site_logo',
  'business_phone',
  'business_email',
  'business_address',
  'working_hours',
  'contact_google_map',
  'social_facebook',
  'social_instagram',
  'social_viber_number',
  'social_messenger_user',
  'social_facebook_page_id',
]);

type ConfigRow = { key: string; value: string };

const getConfigRows = unstable_cache(
  async () => {
    if (!supabaseUrl || !supabaseAnonKey) return [] as ConfigRow[];

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.from('ai_config').select('key, value');

    if (error) {
      console.error('Failed to fetch site config:', error);
      return [] as ConfigRow[];
    }

    return (data || []) as ConfigRow[];
  },
  ['ai-config:rows'],
  { revalidate: 300, tags: ['site-settings'] }
);

async function getSettings() {
  const rows = await getConfigRows();
  const settings: Record<string, string> = {};

  rows.forEach((row) => {
    settings[row.key] = row.value;
  });

  return settings;
}

function getClientSafeSettings(settings: Record<string, string>) {
  const safe: Record<string, string> = {};

  Object.entries(settings).forEach(([key, value]) => {
    if (PUBLIC_CLIENT_SETTING_KEYS.has(key) || key.startsWith('whyus_')) {
      safe[key] = value;
    }
  });

  return safe;
}

async function getAnalyticsConfig() {
  const settings = await getSettings();

  return {
    googleAnalyticsId: settings.google_analytics_id,
    facebookPixelId: settings.facebook_pixel_id,
    tiktokPixelId: settings.tiktok_pixel_id,
    googleAdsId: settings.google_ads_id,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = settings.site_url || process.env.NEXT_PUBLIC_SITE_URL || 'https://signshaus.ph';

  const title = settings.seo_title || "SignsHaus — Premium Signage Maker in Metro Manila";
  const description = settings.seo_description || "Professional signage fabrication & installation in Metro Manila. Acrylic build-up, stainless steel, LED neon, panaflex lightbox. Free ocular inspection. Get a quote today!";
  const ogImage = settings.seo_og_image || "/images/og-image.jpg";
  const favicon = settings.site_favicon || "/logo-web.png";

  return {
    title: {
      default: title,
      template: `%s | ${settings.company_name || 'SignsHaus'}`,
    },
    metadataBase: new URL(siteUrl),
    alternates: {
      canonical: '/',
      languages: {
        'en-PH': '/',
      },
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
        { url: favicon, href: favicon, sizes: 'any', type: 'image/png' },
      ],
      shortcut: [
        { url: favicon, href: favicon, type: 'image/png' },
      ],
      apple: [
        { url: favicon, href: favicon, sizes: '180x180', type: 'image/png' },
      ],
    },
    openGraph: {
      title: title,
      description: description,
      url: siteUrl,
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
  const [analyticsConfig, settings] = await Promise.all([getAnalyticsConfig(), getSettings()]);
  const clientSafeSettings = getClientSafeSettings(settings);

  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} antialiased font-[family-name:var(--font-inter)]`}>
        <Suspense>
          <SettingsProvider initialSettings={clientSafeSettings}>
            <Analytics {...analyticsConfig} />
            <JsonLd />
            {children}
            <FloatingChatLoader />
          </SettingsProvider>
        </Suspense>
      </body>
    </html>
  );
}
