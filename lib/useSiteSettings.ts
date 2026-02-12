import { useSettingsContext } from '@/components/SettingsProvider';

import { getViberLink, getMessengerLink } from './socialUtils';

export function useSiteSettings() {
    const { settings } = useSettingsContext();

    return {
        // Hero Section
        heroTitle: settings.hero_title || "We Build Signs That Stand Out.",
        heroSubtitle: settings.hero_subtitle || "From sleek acrylic build-ups to durable stainless steel and vibrant LED neons. We craft the face of your business with precision and care.",
        heroImage: settings.hero_image,

        // SEO / Branding
        companyName: settings.company_name || 'SignsHaus',
        description: settings.site_description || 'Professional Signage Maker in Metro Manila',
        logo: settings.site_logo,

        // Contact Info
        phone: settings.business_phone || "+63 917 123 4567",
        email: settings.business_email || "inquiry@signshaus.ph",
        address: settings.business_address || "Unit 123, Sample Building, Makati City, Metro Manila",
        workingHours: settings.working_hours || "Mon–Sat: 8AM – 6PM",
        mapEmbedUrl: settings.contact_google_map,

        // Social Links (Smart)
        facebook: settings.social_facebook || "#",
        instagram: settings.social_instagram || "#",
        viber: getViberLink(settings.social_viber_number), 
        // Fallback: If messenger user is not set, try to extract from facebook link
        messenger: getMessengerLink(settings.social_messenger_user || settings.social_facebook), 
        facebookPageId: settings.social_facebook_page_id,

        // Raw values (for Admin or specific uses)
        rawViberNumber: settings.social_viber_number,
        rawMessengerUser: settings.social_messenger_user,

        // Raw settings access
        get: (key: string, fallback?: string) => settings[key] || fallback
    };
}
