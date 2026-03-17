'use client';

import Script from 'next/script';
import { useSiteSettings } from '@/lib/useSiteSettings';
import { safeJsonLdStringify } from '@/lib/security';

export default function JsonLd() {
    const {
        companyName,
        description,
        phone,
        address,
        email,
        facebook,
        instagram,
        logo
    } = useSiteSettings();

    const siteUrl = 'https://signshaus.ph';
    const brandName = companyName || 'SignsHaus';

    const schema = {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'Organization',
                '@id': `${siteUrl}/#organization`,
                name: brandName,
                url: siteUrl,
                logo: logo || `${siteUrl}/logo-web.png`,
                sameAs: [facebook, instagram].filter(Boolean),
                contactPoint: phone ? [{
                    '@type': 'ContactPoint',
                    telephone: phone,
                    contactType: 'sales',
                    areaServed: 'PH',
                    availableLanguage: ['en', 'fil']
                }] : undefined,
            },
            {
                '@type': 'WebSite',
                '@id': `${siteUrl}/#website`,
                url: siteUrl,
                name: brandName,
                publisher: { '@id': `${siteUrl}/#organization` },
                potentialAction: {
                    '@type': 'SearchAction',
                    target: `${siteUrl}/blog?search={search_term_string}`,
                    'query-input': 'required name=search_term_string'
                }
            },
            {
                '@type': 'LocalBusiness',
                '@id': `${siteUrl}/#localbusiness`,
                name: brandName,
                image: logo || `${siteUrl}/logo-web.png`,
                description: description || 'Professional Signage Maker in Metro Manila',
                telephone: phone,
                email: email,
                address: {
                    '@type': 'PostalAddress',
                    streetAddress: address || 'Metro Manila',
                    addressLocality: 'Makati',
                    addressRegion: 'Metro Manila',
                    addressCountry: 'PH'
                },
                url: siteUrl,
                sameAs: [facebook, instagram].filter(Boolean),
                priceRange: '$$',
                openingHoursSpecification: [
                    {
                        '@type': 'OpeningHoursSpecification',
                        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                        opens: '09:00',
                        closes: '18:00'
                    }
                ]
            }
        ]
    };

    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(schema) }}
        />
    );
}
