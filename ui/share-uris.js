var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export function whatsappShareUri(text) {
    if (!isMobile) 
    	return `https://web.whatsapp.com/send?text=${ encodeURIComponent(text) }`;
    return `whatsapp://send?text=${ encodeURIComponent(text) }`;
}

export function telegramShareUri(text) {
    return `tg://msg?text=${ encodeURIComponent(text) }`;
}

export function smsShareUrl(text) {
    // return `sms:// /&body=${ encodeURIComponent(text) }`     // Android
    // return `sms:// /?body=${ encodeURIComponent(text) }`     // iOS
}

// navigator.registerProtocolHandler('whatsapp', 'https://web.whatsapp.com/send?text=%s', 'WhatsApp');
