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
    const { data } = await supabase.from('ai_config').select('*').in('key', ['google_analytics_id', 'facebook_pixel_id', 'tiktok_pixel_id']);

    const config: Record<string, string> = {};
    data?.forEach((row: any) => { config[row.key] = row.value; });

    return {
      googleAnalyticsId: config.google_analytics_id,
      facebookPixelId: config.facebook_pixel_id,
      tiktokPixelId: config.tiktok_pixel_id
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

export const metadata: Metadata = {
  title: "SignsHaus — Premium Signage Maker in Metro Manila",
  description:
    "Professional signage fabrication & installation in Metro Manila. Acrylic build-up, stainless steel, LED neon, panaflex lightbox. Free ocular inspection. Get a quote today!",
  keywords: [
    "signage maker Manila",
    "acrylic signage Philippines",
    "stainless steel letters",
    "LED neon signs",
    "panaflex signage",
    "building signage Metro Manila",
  ],
  openGraph: {
    title: "SignsHaus — Premium Signage Maker in Metro Manila",
    description:
      "Professional signage fabrication & installation. Free ocular inspection across Metro Manila.",
    type: "website",
    locale: "en_PH",
    siteName: "SignsHaus",
  },
  robots: {
    index: true,
    follow: true,
  },
};

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
