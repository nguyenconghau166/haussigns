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
    // m.me links are universal and handle opening the app or web
    return `https://m.me/${username}`;
};

export const getFacebookLink = (url: string | undefined) => {
    if (!url) return undefined;
    return url;
};

export const getInstagramLink = (url: string | undefined) => {
    if (!url) return undefined;
    return url;
};
