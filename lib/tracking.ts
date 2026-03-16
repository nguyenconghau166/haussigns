type ContactMethod = 'phone' | 'viber' | 'messenger';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

interface ContactClickOptions {
  method: ContactMethod;
  location: string;
  value?: string;
}

export function trackContactClick({ method, location, value }: ContactClickOptions) {
  if (typeof window === 'undefined') return;

  const pagePath = window.location.pathname;
  const gaParams = {
    method,
    location,
    page_path: pagePath,
    value,
  };

  if (window.gtag) {
    window.gtag('event', 'contact_click', gaParams);
  }

  if (window.fbq) {
    window.fbq('track', 'Contact', {
      method,
      location,
      page_path: pagePath,
      value,
    });
  }
}

export function trackLeadSubmit(source = 'contact_form') {
  if (typeof window === 'undefined') return;

  const pagePath = window.location.pathname;

  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      source,
      page_path: pagePath,
    });
  }

  if (window.fbq) {
    window.fbq('track', 'Lead', {
      source,
      page_path: pagePath,
    });
  }
}
