'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void;
  }
}

export default function Analytics({
  googleAnalyticsId,
  facebookPixelId,
  tiktokPixelId,
  googleAdsId
}: {
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  tiktokPixelId?: string;
  googleAdsId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Prefer props, fallback to env
  const gaId = googleAnalyticsId || process.env.NEXT_PUBLIC_GA_ID;
  const fbId = facebookPixelId || process.env.NEXT_PUBLIC_FB_PIXEL_ID;
  const ttId = tiktokPixelId || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  useEffect(() => {
    // Track internal analytics
    fetch('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify({ pathname }),
    }).catch(() => { });

    if (pathname && window.gtag && gaId) {
      window.gtag('config', gaId, {
        page_path: pathname,
      });
    }
  }, [pathname, searchParams, gaId]);

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}

      {/* Facebook Pixel */}
      {fbId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${fbId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      {/* TikTok Pixel */}
      {ttId && (
        <Script
          id="tiktok-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
             !function (w, d, t) {
               w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
               ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
               ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
               for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
               ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
               ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
               ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
               var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
               var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
               ttq.load('${ttId}');
               ttq.page();
             }(window, document, 'ttq');
           `,
          }}
        />
      )}
      {/* Google Ads */}
      {googleAdsId && (
        <Script
          id="google-ads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${googleAdsId}');
            `,
          }}
        />
      )}
    </>
  );
}
