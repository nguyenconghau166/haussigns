'use client';

import Script from 'next/script';
import { useSiteSettings } from '@/lib/useSiteSettings';

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

    const schema = {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: companyName || 'SignsHaus',
        image: logo || 'https://signshaus.ph/logo.png',
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
        url: 'https://signshaus.ph',
        sameAs: [
            facebook,
            instagram
        ].filter(Boolean),
        priceRange: '$$',
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday'
                ],
                opens: '09:00',
                closes: '18:00'
            }
        ]
    };

    return (
        <Script
            id="json-ld"
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}
