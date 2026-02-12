export const getViberLink = (phone: string | undefined) => {
    if (!phone) return undefined;
    // Remove spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    // Ensure it starts with correct format if needed, but often viber just needs the number
    // Standard format logic: viber://chat?number=%2B<number>
    // If user enters 0917..., typical PH format, we might need to convert to 63917...
    let formattedPhone = cleanPhone;
    if (formattedPhone.startsWith('0')) {
        formattedPhone = '63' + formattedPhone.substring(1);
    }

    // Mobile/Desktop deep link
    // Note: 'viber://chat?number=' works on mobile and desktop if app is installed regarding of OS
    // However, on web desktop without app, it might fail. 
    // A safer fallback for web is usually just promoting the number or using a service, 
    // but viber:// is the standard "smart" link.
    return `viber://chat?number=%2B${formattedPhone}`;
};

export const getMessengerLink = (username: string | undefined) => {
    if (!username) return undefined;
    
    // Clean username if user pasted a full URL
    let cleanUser = username;
    
    try {
        if (username.includes('facebook.com')) {
            const url = new URL(username.startsWith('http') ? username : `https://${username}`);
            // Pathname usually /username or /pages/category/page-name/id
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                // If format is /pages/..., we might need the ID or the last part.
                // Usually for business pages: /pagename-id/
                cleanUser = pathParts[pathParts.length - 1];
            }
        } else if (username.includes('m.me')) {
            const url = new URL(username.startsWith('http') ? username : `https://${username}`);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                cleanUser = pathParts[0];
            }
        }
    } catch (e) {
        // Fallback to simple split if URL parsing fails
        if (username.includes('/')) {
            const parts = username.split('/');
            cleanUser = parts[parts.length - 1] || parts[parts.length - 2];
        }
    }

    // Remove any query params or anchors if leaked in
    cleanUser = cleanUser.split('?')[0].split('#')[0];

    if (!cleanUser) return undefined;

    // Use full messenger.com URL to avoid SSL/DNS issues with m.me in some regions/browsers
    return `https://www.messenger.com/t/${cleanUser}`;
};

export const getFacebookLink = (url: string | undefined) => {
    if (!url) return undefined;
    return url;
};

export const getInstagramLink = (url: string | undefined) => {
    if (!url) return undefined;
    return url;
};
