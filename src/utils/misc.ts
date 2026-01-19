import { OSPlatform } from "../types/system";


export const isContentURI = (uri : string) => {
    return uri.startsWith('content://');
}

export const isFileURI = (uri : string) => {
    return uri.startsWith('file://');
}

export const isValidURL = (uri : string,allowedSchemes : string[] = ['http','https']) => {
    const {protocol} = new URL(uri);
    try {
        return allowedSchemes.some((scheme) => `${scheme}:` === protocol);
    } catch (error) {
        return false;
    }
}
export const getOSPlatform = () : OSPlatform => {
    const userAgent = navigator.userAgent.toLowerCase();
    if(/iphone|ipod|ipad/.test(userAgent)) return 'ios';
    if(userAgent.includes('android')) return 'android';
    if(userAgent.includes('macintosh') || userAgent.includes('mac os x')) return 'macos';
    if(userAgent.includes('window nt')) return 'windows';
    if(userAgent.includes('linux')) return 'linux'; 
    return 'unknown';
};
export const getLocale = () => {
    return localStorage.getItem('i18nextLng') || navigator?.language || '';
}; 
export const getUserLang = () => {
    const locale = getLocale();
    return locale.split('-')[0] || 'en';
};

export const makeSafeFilename = (filename : string, replacement = '_') => {
    const unsafeCharacters = /[<>:"\/\\|?*\x00-\x1F]/g;
    const reservedFilenames = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;
    
    const maxFilenameBytes = 250;

    let safeName = filename.replace(unsafeCharacters,replacement);

    if(reservedFilenames.test(safeName)){
        safeName = `${safeName}${replacement}`;
    }
    const encoder = new TextEncoder();
    let utf8Bytes = encoder.encode(safeName);

    while(utf8Bytes.length > maxFilenameBytes){
        safeName = safeName.slice(0,-1);
        utf8Bytes = encoder.encode(safeName);
    }
    return safeName.trim();
}


